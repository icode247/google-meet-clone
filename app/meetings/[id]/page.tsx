'use client'

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import SimplePeer from "simple-peer"
import { io, Socket } from "socket.io-client"
import { getCookie } from "cookies-next"
import Chat from "@/components/meeting/chat"
import { User } from "@/types"
import Controls from "@/components/meeting/controls"
import ParticipantList from "@/components/meeting/participant-list"
import { useMeetingStore } from "@/store/meeting-store"

interface ExtendedSimplePeer extends SimplePeer.Instance {
  _pc: RTCPeerConnection
}

interface Peer {
  peer: SimplePeer.Instance
  userId: string
  stream?: MediaStream
}

export default function ConferenceRoom() {
  const params = useParams()
  const [peers, setPeers] = useState<Peer[]>([])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const socketRef = useRef<Socket>()
  const userVideo = useRef<HTMLVideoElement>(null)
  const peersRef = useRef<Peer[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        })

        screen.getVideoTracks()[0].addEventListener("ended", () => {
          stopScreenSharing()
        })

        setScreenStream(screen)
        setIsScreenSharing(true)

        peersRef.current.forEach(({ peer }) => {
          const videoTrack = screen.getVideoTracks()[0]
          const extendedPeer = peer as ExtendedSimplePeer
          const sender = extendedPeer._pc
            .getSenders()
            .find((s) => s.track?.kind === "video")

          if (sender) {
            sender.replaceTrack(videoTrack)
          }
        })

        if (userVideo.current) {
          userVideo.current.srcObject = screen
        }
      } catch (error) {
        console.error("Error sharing screen:", error)
      }
    } else {
      stopScreenSharing()
    }
  }

  const stopScreenSharing = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop())
      setScreenStream(null)
      setIsScreenSharing(false)

      if (stream) {
        peersRef.current.forEach(({ peer }) => {
          const videoTrack = stream.getVideoTracks()[0]
          const extendedPeer = peer as ExtendedSimplePeer
          const sender = extendedPeer._pc
            .getSenders()
            .find((s) => s.track?.kind === "video")

          if (sender) {
            sender.replaceTrack(videoTrack)
          }
        })

        if (userVideo.current) {
          userVideo.current.srcObject = stream
        }
      }
    }
  }

  useEffect(() => {
    try {
      const cookieValue = getCookie("auth-storage")
      if (cookieValue) {
        const parsedAuthState = JSON.parse(String(cookieValue))
        setUser(parsedAuthState.state.user)
      }
    } catch (error) {
      console.error("Error parsing auth cookie:", error)
    }
  }, [])

  useEffect(() => {
    if (!user?.id || !params.id) return

    const cleanupPeers = () => {
      peersRef.current.forEach((peer) => {
        if (peer.peer) {
          peer.peer.destroy()
        }
      })
      peersRef.current = []
      setPeers([])
    }

    cleanupPeers()

    socketRef.current = io(process.env.NEXT_PUBLIC_STRAPI_URL || "", {
      query: { meetingId: params.id, userId: user.id },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    })

    socketRef.current.on("connect", () => {
      setIsConnected(true)
      console.log("Socket connected:", socketRef.current?.id)
    })

    socketRef.current.on("disconnect", () => {
      setIsConnected(false)
      console.log("Socket disconnected")
    })

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream)
        if (userVideo.current) {
          userVideo.current.srcObject = stream
        }

        socketRef.current?.emit("join-meeting", {
          userId: user.id,
          meetingId: params.id,
        })

        socketRef.current?.on("signal", ({ userId, signal }) => {
          console.log("Received signal from:", userId, "Signal type:", signal.type)
          let peer = peersRef.current.find((p) => p.userId === userId)

          if (!peer && stream) {
            console.log("Creating new peer for signal from:", userId)
            const newPeer = createPeer(userId, stream, false)
            peer = { peer: newPeer, userId }
            peersRef.current.push(peer)
            setPeers([...peersRef.current])
          }

          if (peer) {
            try {
              peer.peer.signal(signal)
            } catch (err) {
              console.error("Error processing signal:", err)
            }
          }
        })

        socketRef.current?.on("participants-list", (participants) => {
          console.log("Received participants list:", participants)

          cleanupPeers()

          participants.forEach(({ userId, username }: any) => {
            if (userId !== user?.id.toString()) {
              useMeetingStore.getState().addParticipant({
                id: userId,
                username,
                isAudioEnabled: true,
                isVideoEnabled: true,
                isScreenSharing: false,
              })

              if (stream) {
                console.log("Creating initiator peer for existing participant:", userId)
                const peer = createPeer(userId, stream, true)
                peersRef.current.push({ peer, userId })
              }
            }
          })

          setPeers([...peersRef.current])
        })

        socketRef.current?.on("user-joined", ({ userId, username }) => {
          console.log("New user joined:", userId)
          if (userId !== user?.id.toString()) {
            useMeetingStore.getState().addParticipant({
              id: userId,
              username,
              isAudioEnabled: true,
              isVideoEnabled: true,
              isScreenSharing: false,
            })

            if (stream && !peersRef.current.find((p) => p.userId === userId)) {
              console.log("Creating non-initiator peer for new user:", userId)
              const peer = createPeer(userId, stream, false)
              peersRef.current.push({ peer, userId })
              setPeers([...peersRef.current])
            }
          }
        })

        socketRef.current?.on("user-left", ({ userId }) => {
          console.log("User left:", userId)
          const peerIndex = peersRef.current.findIndex((p) => p.userId === userId)
          if (peerIndex !== -1) {
            peersRef.current[peerIndex].peer.destroy()
            peersRef.current.splice(peerIndex, 1)
            setPeers([...peersRef.current])
          }
          useMeetingStore.getState().removeParticipant(userId)
        })
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error)
      })

    return () => {
      useMeetingStore.getState().clearParticipants()

      if (socketRef.current) {
        socketRef.current.emit("leave-meeting", {
          userId: user?.id,
          meetingId: params.id,
        })

        socketRef.current.off("participants-list")
        socketRef.current.off("user-joined")
        socketRef.current.off("user-left")
        socketRef.current.off("signal")
        socketRef.current.disconnect()
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop())
      }

      cleanupPeers()
    }
  }, [user?.id, params.id])

  useEffect(() => {
    if (!socketRef.current) return

    socketRef.current.on("media-state-change", ({ userId, type, enabled }) => {
      useMeetingStore.getState().updateMediaState(userId, type, enabled)
    })

    return () => {
      socketRef.current?.off("media-state-change")
    }
  }, [socketRef.current])

  function createPeer(userId: string, stream: MediaStream, initiator: boolean): SimplePeer.Instance {
    console.log(`Creating peer connection - initiator: ${initiator}, userId: ${userId}`)

    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      },
    })

    peer.on("signal", (signal) => {
      console.log(`Sending signal to ${userId}, type: ${signal.type}`)
      socketRef.current?.emit("signal", {
        signal,
        to: userId,
        from: user?.id,
      })
    })

    peer.on("connect", () => {
      console.log(`Peer connection established with ${userId}`)
    })

    peer.on("stream", (incomingStream) => {
      console.log(`Received stream from ${userId}, tracks:`, incomingStream.getTracks())
      const peerIndex = peersRef.current.findIndex((p) => p.userId === userId)
      if (peerIndex !== -1) {
        peersRef.current[peerIndex].stream = incomingStream
        setPeers([...peersRef.current])
      }
    })

    peer.on("error", (err) => {
      console.error(`Peer error with ${userId}:`, err)
      const peerIndex = peersRef.current.findIndex((p) => p.userId === userId)
      if (peerIndex !== -1) {
        peersRef.current[peerIndex].peer.destroy()
        peersRef.current.splice(peerIndex, 1)
        setPeers([...peersRef.current])
      }
    })

    peer.on("close", () => {
      console.log(`Peer connection closed with ${userId}`)
    })

    return peer
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-sm text-gray-500">
        {isConnected ? "Connected to server" : "Disconnected from server"}
      </div>
      <ParticipantList />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
          <video
            ref={userVideo}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg bg-gray-900"
          />
          <Controls
            stream={stream}
            screenStream={screenStream}
            isScreenSharing={isScreenSharing}
            socketRef={socketRef}
            peersRef={peersRef}
            meetingId={params.id as string}
            userId={user?.id.toString() || ""}
            onScreenShare={toggleScreenShare}
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            You
          </div>
        </div>
        {peers.map(({ peer, userId, stream }) => (
          <PeerVideo key={userId} peer={peer} userId={userId} stream={stream} />
        ))}
      </div>
      <Chat socketRef={socketRef} user={user as User} meetingId={params.id as string} />
    </div>
  )
}

function PeerVideo({ peer, userId, stream }: { peer: SimplePeer.Instance; userId: string; stream?: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null)
  const participant = useMeetingStore((state) => state.participants[userId])

  useEffect(() => {
    if (stream && ref.current) {
      ref.current.srcObject = stream
    }

    const handleStream = (incomingStream: MediaStream) => {
      if (ref.current) {
        ref.current.srcObject = incomingStream
      }
    }

    peer.on("stream", handleStream)

    return () => {
      if (ref.current) {
        ref.current.srcObject = null
      }
      peer.off("stream", handleStream)
    }
  }, [peer, stream])

  return (
    <div className="relative">
      <video ref={ref} autoPlay playsInline className="w-full rounded-lg bg-gray-900" />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
        {participant?.username || "Unknown User"}
      </div>
    </div>
  )
}