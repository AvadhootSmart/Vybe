const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');

// Route to stream YouTube audio
router.post('/youtube-audio', async (req, res) => {
  try {
    const { videoId } = req.body;
    
    // Validate videoId
    if (!videoId || typeof videoId !== 'string' || !videoId.match(/^[a-zA-Z0-9_-]{11}$/)) {
      return res.status(400).json({ error: 'Invalid videoId format' });
    }
    
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // First, get video info to set appropriate filename
    const infoProcess = spawn('yt-dlp', [
      '--print', '%(title)s',
      '--no-warnings',
      '--no-check-certificate',
      videoUrl
    ]);
    
    let videoTitle = '';
    
    infoProcess.stdout.on('data', (data) => {
      videoTitle += data.toString().trim();
    });
    
    infoProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: 'Failed to retrieve video info' });
      }
      
      const sanitizedTitle = videoTitle.replace(/[^\w\s.-]/g, '') || 'audio';
      
      // Set response headers
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${sanitizedTitle}.mp3"`);
      
      // Spawn yt-dlp process to download and pipe audio
      const ytdlpProcess = spawn('yt-dlp', [
        '-o', '-',               // Output to stdout
        '-x',                    // Extract audio
        '--audio-format', 'mp3', // Convert to mp3
        '--audio-quality', '0',  // Best quality
        '--no-warnings',
        '--no-check-certificate',
        '--prefer-free-formats',
        videoUrl
      ]);
      
      // Pipe ytdlp output to response
      ytdlpProcess.stdout.pipe(res);
      
      // Handle potential errors
      ytdlpProcess.stderr.on('data', (data) => {
        console.error(`yt-dlp stderr: ${data.toString()}`);
      });
      
      ytdlpProcess.on('error', (error) => {
        console.error('Failed to start yt-dlp process:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to process video' });
        } else {
          res.end();
        }
      });
      
      // Clean up on client disconnect
      req.on('close', () => {
        ytdlpProcess.kill();
      });
    });
    
    infoProcess.stderr.on('data', (data) => {
      console.error(`Info process stderr: ${data.toString()}`);
    });
    
    infoProcess.on('error', (error) => {
      console.error('Failed to start info process:', error);
      res.status(500).json({ error: 'Failed to retrieve video info' });
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error processing video' });
    } else {
      res.end();
    }
  }
});

module.exports = router;
