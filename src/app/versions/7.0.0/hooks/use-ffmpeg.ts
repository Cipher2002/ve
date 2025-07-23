import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useCallback, useRef, useState, useEffect } from 'react';

export const useFFmpeg = () => {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      ffmpegRef.current = new FFmpeg();
    }
  }, []);

const load = useCallback(async () => {
    if (!isClient || !ffmpegRef.current) return;
    
    const ffmpeg = ffmpegRef.current;
    
    if (!ffmpeg.loaded) {
        try {
        console.log('Loading FFmpeg...');
        
        // Use the simpler load without specifying URLs
        await ffmpeg.load();
        
        console.log('FFmpeg loaded successfully');
        } catch (error) {
        console.error('Failed to load FFmpeg:', error);
        throw new Error('Failed to load FFmpeg WebAssembly modules');
        }
    }
}, [isClient]);

  const extractAudio = useCallback(async (videoFile: File) => {
    if (!isClient || !ffmpegRef.current) {
        throw new Error('FFmpeg not available on server side');
    }

    console.log('FFmpeg extractAudio called with file:', videoFile.name, videoFile.size);

    setIsLoading(true);
    try {
        const ffmpeg = ffmpegRef.current;
        console.log('Loading FFmpeg...');
        await load();
        console.log('FFmpeg loaded successfully');

        // Write input file
        console.log('Writing input file...');
        await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
        console.log('Input file written');

        // Extract audio
        console.log('Executing FFmpeg command...');
        try {
        // First try with libmp3lame
        await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', '-ab', '128k', 'output.mp3']);
        } catch (error) {
        console.log('libmp3lame failed, trying pcm_s16le...');
        // Fallback to WAV format
        await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', 'output.wav']);
        
        // Update the blob creation to handle WAV
        const data = await ffmpeg.readFile('output.wav');
        const audioBlob = new Blob([data], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Clean up WAV file
        await ffmpeg.deleteFile('output.wav');
        return audioUrl;
        }
        console.log('FFmpeg command executed');

        // Read output
        console.log('Reading output file...');
        const data = await ffmpeg.readFile('output.mp3');
        console.log('Output file read, size:', data.length);
        
        // Create blob URL for the extracted audio
        const audioBlob = new Blob([data], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('Audio blob URL created:', audioUrl);

        // Clean up
        await ffmpeg.deleteFile('input.mp4');
        await ffmpeg.deleteFile('output.mp3');

        return audioUrl;
    } catch (error) {
        console.error('Error in FFmpeg extractAudio:', error);
        throw error;
    } finally {
        setIsLoading(false);
    }
    }, [load, isClient]);

  return { extractAudio, isLoading: isLoading && isClient };
};