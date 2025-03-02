const express = require("express");
const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const SpotifyWebApi = require("spotify-web-api-node");

const SpotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: `http://localhost:5000/auth/spotify/callback`,
});

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: `${process.env.FRONTEND_URL}`,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "jai shree Ram",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `http://localhost:${PORT}/auth/google/callback`,
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, {
        accessToken: accessToken,
        refreshToken: refreshToken,
        profile: profile,
      });
    }
  )
);

passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      callbackURL: `http://localhost:${PORT}/auth/spotify/callback`,
    },
    function (accessToken, refreshToken, expires_in, profile, done) {
      try {
        return done(null, {
          accessToken: accessToken,
          refreshToken: refreshToken,
          profile: profile,
        });
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

//SPOTIFY AUTHENTICATION ROUTES:
app.get(
  "/auth/spotify",
  passport.authenticate("spotify", {
    scope: [
      "user-read-email",
      "user-read-private",
      "streaming",
      "playlist-read-private",
    ],
    showDialog: true,
  })
);

app.get(
  "/auth/spotify/callback",
  passport.authenticate("spotify", {
    failureRedirect: `${process.env.FRONTEND_URL}`,
  }),
  (req, res) => {
    res.cookie("spotifyAccessToken", req.user.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });
    res.redirect(`${process.env.FRONTEND_URL}/Home`);
  }
);

//GOOGLE AUTHENTICATION ROUTES:
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/youtube"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}`,
  }),
  (req, res) => {
    res.cookie("googleAccessToken", req.user.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });
    res.redirect(`${process.env.FRONTEND_URL}/Home`);
  }
);

//Routes for spotify api
app.get("/spotify/playlists", async (req, res) => {
  try {
    const accessToken = req.headers.authorization.split(" ")[1];
    if (!accessToken) {
      return res.status(401).json({ error: "No access token provided" });
    }

    const response = await fetch("https://api.spotify.com/v1/me/playlists", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch playlists");
    }

    const playlists = await response.json();
    res.json(playlists);
  } catch (error) {
    console.error("Error fetching playlists:", error);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

app.get("/spotify/playlist/:playlistId", async (req, res) => {
  const playlistId = req.params.playlistId;
  const accessToken = req.headers.authorization.split(" ")[1];
  const response = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data = await response.json();
  res.json(data);
});

//Get youtube video id for track
app.post("/youtube/search", async (req, res) => {
  try {
    const { trackName, artistName } = req.body;
    const response = await fetch(
      `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${trackName}-${artistName}&key=${process.env.YOUTUBE_API_KEY}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("YouTube API request failed");
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error searching YouTube:", error);
    res.status(500).json({ error: "Failed to search YouTube" });
  }
});

app.post("/youtube/createPlaylist", async (req, res) => {
  try {
    const { ytPlaylistName } = req.body;
    const accessToken = req.headers.authorization.split(" ")[1];
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/playlists",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            title: ytPlaylistName,
          },
        }),
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error creating YouTube playlist:", error);
    res.status(500).json({ error: "Failed to create YouTube playlist" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening http://localhost:${PORT}`);
});

// GET https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=Levels%2C%20Avicii&key=[YOUR_API_KEY] HTTP/1.1

// Authorization: Bearer [YOUR_ACCESS_TOKEN]
// Accept: application/json
