import { useState, useEffect } from "react";

function Player({ trackId, isPlayer }) {
  const embedUri = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;

  
  return (
    <div>
      {isPlayer ? (
        <iframe
          // style={'border-radius:12px'}
          src={embedUri}
          width="100%"
          height="352"
          frameBorder="0"
          // allowfullscreen=""
          allow="encrypted-media; autoplay"
          loading="lazy"
        ></iframe>
      ) : (
        <div>Loading....</div>
      )}
    </div>
  );
}

export default Player;
