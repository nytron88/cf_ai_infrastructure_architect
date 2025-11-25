"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SpeechRecognitionInstance,
  SpeechRecognitionConstructor,
} from "@/app/types/chat";

export interface UseSpeechRecognitionReturn {
  supportsVoice: boolean;
  isListening: boolean;
  voiceTranscript: string;
  voiceError: string;
  toggleListening: () => void;
}

export function useSpeechRecognition(
  onFinalTranscript: (transcript: string) => void
): UseSpeechRecognitionReturn {
  const [supportsVoice, setSupportsVoice] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isStartingRef = useRef(false);
  const onFinalTranscriptRef = useRef(onFinalTranscript);

  // Keep callback ref updated
  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const describeSpeechError = useCallback((errorCode: string) => {
    switch (errorCode) {
      case "not-allowed":
        return "Microphone permission denied. Enable it in your browser settings.";
      case "service-not-allowed":
        return "Speech service blocked. Check browser privacy settings.";
      case "audio-capture":
        return "No microphone detected.";
      case "network":
        return "Speech service network error. Check your connection and try again.";
      case "no-speech":
        return "No speech detected. Please speak louder or try again.";
      case "aborted":
        return "Speech recognition was stopped.";
      case "bad-grammar":
        return "Speech recognition grammar error.";
      default:
        return `Speech recognition error: ${errorCode}`;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
    }
    setIsListening(false);
    setVoiceTranscript("");
    isStartingRef.current = false;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionClass: SpeechRecognitionConstructor | undefined =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSupportsVoice(false);
      return;
    }

    setSupportsVoice(true);
    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      // Show interim results
      if (interim) {
        setVoiceTranscript(interim);
      }

      // Handle final transcript
      if (finalTranscript.trim()) {
        setVoiceTranscript("");
        stopRecognition();
        // Use ref to avoid stale closure
        onFinalTranscriptRef.current(finalTranscript.trim());
      } else if (!interim && finalTranscript) {
        // If we have final but no interim, still show it briefly
        setVoiceTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      const errorCode = event.error;
      
      // Don't show error for "no-speech" if user manually stopped
      if (errorCode === "no-speech" && !isListening) {
        return;
      }

      // Handle specific errors
      if (errorCode === "not-allowed" || errorCode === "service-not-allowed") {
        setVoiceError(describeSpeechError(errorCode));
        stopRecognition();
      } else if (errorCode === "aborted") {
        // Aborted is usually fine, just stop
        stopRecognition();
      } else {
        setVoiceError(describeSpeechError(errorCode));
        stopRecognition();
      }
    };

    recognition.onend = () => {
      // Only reset if we're still supposed to be listening
      // This prevents clearing state when manually stopped
      if (isListening && !isStartingRef.current) {
        setIsListening(false);
        setVoiceTranscript("");
      }
      isStartingRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      stopRecognition();
    };
  }, [describeSpeechError, stopRecognition, isListening]);

  const toggleListening = useCallback(() => {
    if (!supportsVoice) {
      setVoiceError(
        "Voice capture requires a browser with the Web Speech API (Chrome / Edge)."
      );
      return;
    }

    if (isListening) {
      // Stop listening
      stopRecognition();
      return;
    }

    // Start listening
    if (!recognitionRef.current) {
      setVoiceError("Speech recognition not available. Please refresh the page.");
      return;
    }

    // Clear previous errors and transcript
    setVoiceError("");
    setVoiceTranscript("");
    isStartingRef.current = true;

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error: unknown) {
      isStartingRef.current = false;
      setIsListening(false);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.name === "InvalidStateError" || error.message.includes("already started")) {
          // Recognition is already running, just update state
          setIsListening(true);
          return;
        }
        setVoiceError(error.message || "Failed to start microphone. Check permissions.");
      } else {
        setVoiceError("Failed to start microphone. Check permissions.");
      }
    }
  }, [isListening, supportsVoice, stopRecognition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, [stopRecognition]);

  return {
    supportsVoice,
    isListening,
    voiceTranscript,
    voiceError,
    toggleListening,
  };
}

