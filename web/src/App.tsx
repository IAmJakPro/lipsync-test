import { useState, useRef, useEffect } from "react";
import axios from "axios";
function App() {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef(null);
  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage((reader?.result as any).split(",")[1]); // Get base64 data
    };
    reader.readAsDataURL(file);
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!text || !image) {
      alert("Please provide both text and image.");
      return;
    }
    setIsProcessing(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/process",
        { text, image },
        {
          responseType: "arraybuffer", // Important: Request binary data
        }
      );
      // Create a Blob from the response data
      const blob = new Blob([response.data], { type: "video/mp4" }); // Assuming MP4 format
      // Create a URL object for the blob
      const url = URL.createObjectURL(blob);
      // Set the video source to the URL
      (videoRef.current as any).src = url;
      // Play the video
      (videoRef.current as any).play();
    } catch (error) {
      console.error("Error processing request:", error);
      alert("An error occurred while processing your request.");
    } finally {
      setIsProcessing(false);
    }
  };
  useEffect(() => {
    // Cleanup function to release resources when component unmounts
    return () => {
      const video = videoRef.current as any;
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach((track: any) => track.stop());
        video.srcObject = null;
      }
    };
  }, []);
  return (
    <div className="App">
      <h1>Lipsync AI</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text here"
          rows={4}
          cols={50}
        />
        <br />
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <br />
        <button type="submit" disabled={isProcessing}>
          {isProcessing ? "Processing..." : "Generate Lipsync Video"}
        </button>
      </form>
      <video
        ref={videoRef}
        controls
        style={{ marginTop: "20px", maxWidth: "100%" }}
      />
    </div>
  );
}
export default App;
