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

  const describeSpeechError = useCallback((errorCode: string) => {
    switch (errorCode) {
      case "not-allowed":
        return "Microphone permission denied. Enable it in your browser settings.";
      case "service-not-allowed":
        return "Speech service blocked. Check browser privacy settings.";
      case "audio-capture":
        return "No microphone detected.";
      case "network":
        return "Speech service network error. Double-check your connection and try again.";
      case "no-speech":
        return "No speech detected. Please speak louder or try again.";
      default:
        return "Microphone error";
    }
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

      setVoiceTranscript(interim || finalTranscript || "");

      if (finalTranscript.trim()) {
        setVoiceTranscript("");
        onFinalTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      setVoiceError(describeSpeechError(event.error));
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setVoiceTranscript("");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [describeSpeechError, onFinalTranscript]);

  const toggleListening = useCallback(() => {
    if (!supportsVoice) {
      setVoiceError(
        "Voice capture requires a browser with the Web Speech API (Chrome / Edge)."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    setVoiceError("");
    setVoiceTranscript("");

    try {
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Microphone unavailable";
      setVoiceError(reason);
    }
  }, [isListening, supportsVoice]);

  return {
    supportsVoice,
    isListening,
    voiceTranscript,
    voiceError,
    toggleListening,
  };
}

