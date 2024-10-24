"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Mail, Loader2 } from "lucide-react";
import apiClient from "@/lib/api-client";

interface FormErrors {
  title?: string;
  startTime?: string;
  endTime?: string;
  email?: string;
}

export default function NewMeetingForm() {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [email, setEmail] = useState("");
  const [participantEmails, setParticipantEmails] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addParticipant = () => {
    if (!email.trim()) {
      setErrors({ ...errors, email: "Email is required" });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ ...errors, email: "Invalid email format" });
      return;
    }

    if (participantEmails.includes(email)) {
      setErrors({ ...errors, email: "Email already added" });
      return;
    }

    setParticipantEmails([...participantEmails, email.trim()]);
    setEmail("");
    setErrors({ ...errors, email: undefined });
  };

  const removeParticipant = (emailToRemove: string) => {
    setParticipantEmails(participantEmails.filter(email => email !== emailToRemove));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (!endTime) {
      newErrors.endTime = "End time is required";
    }

    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      newErrors.endTime = "End time must be after start time";
    }

    if (startTime && new Date(startTime) < new Date()) {
      newErrors.startTime = "Start time cannot be in the past";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post("/meetings", {
        data: {
          title,
          startTime,
          endTime,
          isActive: false,
          participantEmails,
        },
      });

      if (response.data.meta?.invalidEmails?.length > 0) {
        // Handle invalid emails if needed
        console.warn("Some emails were invalid:", response.data.meta.invalidEmails);
      }

      router.push("/meetings");
    } catch (error) {
      console.error("Failed to create meeting:", error);
      // You might want to show an error notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      <div>
        <label className="block text-sm font-medium text-gray-100">
          Meeting Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`mt-1 block w-full rounded-md border text-gray-600 border-gray-300 px-3 py-2 ${
            errors.title ? 'border-red-500' : ''
          }`}
          required
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-100">
          Start Time
        </label>
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className={`mt-1 block w-full rounded-md border text-gray-600 border-gray-300 px-3 py-2 ${
            errors.startTime ? 'border-red-500' : ''
          }`}
          required
        />
        {errors.startTime && (
          <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-100">
          End Time
        </label>
        <input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className={`mt-1 block w-full rounded-md border text-gray-600 border-gray-300 px-3 py-2 ${
            errors.endTime ? 'border-red-500' : ''
          }`}
          required
        />
        {errors.endTime && (
          <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-100">
          Add Participants
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addParticipant();
                  }
                }}
                placeholder="Enter email address"
                className={`mt-1 block w-full rounded-md border text-gray-600 border-gray-300 pl-10 pr-3 py-2 ${
                  errors.email ? 'border-red-500' : ''
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={addParticipant}
            className="mt-1 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={20} />
          </button>
        </div>

        {participantEmails.length > 0 && (
          <div className="mt-3 space-y-2">
            {participantEmails.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between p-2 bg-gray-700 rounded-md"
              >
                <span className="text-sm text-gray-200">{email}</span>
                <button
                  type="button"
                  onClick={() => removeParticipant(email)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Creating...
            </>
          ) : (
            'Create Meeting'
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push("/meetings")}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}