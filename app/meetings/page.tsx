"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import Link from "next/link";
import { Meeting } from "@/types";
import { useAuthStore } from "@/store/auth-store";

export default function MeetingList() {
  const authState = useAuthStore((state) => state.user);
  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const response = await apiClient.get(
        `/meetings?filters[participants][id][$eq]=${authState?.id}&populate=*`
      );
      return response.data.data;
    },
  });

  if (isLoading) {
    return <div>Loading meetings...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Meetings</h2>
        <Link
          href="/meetings/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          New Meeting
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {meetings?.map((meeting: Meeting) => (
          <div
            key={meeting.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold">{meeting.title}</h3>
            <p className="text-gray-600">
              {new Date(meeting.startTime).toLocaleString()}
            </p>
            <Link
              href={`/meetings/${meeting.meetingId}`}
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              Join Meeting
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}