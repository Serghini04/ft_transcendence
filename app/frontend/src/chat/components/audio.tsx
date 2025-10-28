import { useState, useEffect, useRef } from "react";
import { Mic, Trash2, Send, Pause, Square } from "lucide-react";

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current!);
    }
    return () => clearInterval(timerRef.current!);
  }, [isRecording]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const localChunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) localChunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(localChunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
      setChunks(localChunks);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
    setSeconds(0);
    setAudioURL(null);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  const deleteRecording = () => {
    setAudioURL(null);
    setChunks([]);
    setSeconds(0);
  };

  const sendRecording = async () => {
    if (!chunks.length) return;
    const blob = new Blob(chunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.append("audio", blob, "voice-message.webm");
    // await axios.post("/upload", formData);
    console.log("Audio ready to send!");
    deleteRecording();
  };

  return (
    <div className="flex items-center gap-3 bg-[#1e293b] p-4 rounded-xl text-white">
      {!audioURL ? (
        !isRecording ? (
          <button
            onClick={startRecording}
            className="p-3 rounded-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Mic size={22} />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></div>
              <span>{String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}</span>
            </div>
            <button
              onClick={stopRecording}
              className="p-3 rounded-full bg-red-600 hover:bg-red-700"
            >
              <Square size={22} />
            </button>
          </div>
        )
      ) : (
        <div className="flex items-center gap-3 w-full">
          <audio controls src={audioURL} className="w-full" />
          <button
            onClick={deleteRecording}
            className="p-3 rounded-full bg-gray-600 hover:bg-gray-700"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={sendRecording}
            className="p-3 rounded-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Send size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
