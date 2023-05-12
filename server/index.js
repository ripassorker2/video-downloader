const express = require("express");
const cors = require("cors");
const ytdl = require("ytdl-core");
const { chain, forEach } = require("lodash");
const ffmpegPath = require("ffmpeg-static");
const { spawn } = require("child_process");
const sanitize = require("sanitize-filename");

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
   res.send("Server is running...");
});

const getResulation = (formats) => {
   let resulationArray = [];

   for (let i = 0; i < formats.length; i++) {
      if (formats[i].qualityLabel !== null) {
         resulationArray.push(formats[i]);
      }
   }
   return [...new Set(resulationArray.map((r) => r.height))];
};

app.get("/api/get-video-info/:videoId", async (req, res) => {
   const videoId = req.params.videoId;
   const { formats, videoDetails } = await ytdl.getInfo(videoId);
   const videoResu = getResulation(formats);

   const { title, thumbnails } = videoDetails;
   return res.status(200).json({
      videoInfo: {
         title,
         videoURL: thumbnails[thumbnails.length - 1].url,
         videoResu,
         lastResu: videoResu[0],
      },
   });
});

app.get("/api/download", async (req, res) => {
   const { id, resu } = req.query;

   try {
      const {
         formats,
         videoDetails: { title },
      } = await ytdl.getInfo(id);
      const videoFormate = chain(formats)
         .filter(
            ({ height, codecs }) =>
               height && height === parseInt(resu) && codecs?.startsWith("avc1")
         )
         .orderBy("fps", "desc")
         .head()
         .value();

      const streams = {};
      streams.video = ytdl(id, { quality: videoFormate?.itag });
      streams.audio = ytdl(id, { quality: "highestaudio" });

      const pipes = {
         out: 1,
         err: 2,
         video: 3,
         audio: 4,
      };

      const ffmepgInputOption = {
         video: [
            "-i",
            `pipe:${pipes.video}`,
            "-i",
            `pipe:${pipes.audio}`,
            "-map",
            "0:v",
            "-map",
            "1:a",
            "-c:v",
            "copy",
            "-c:a",
            "libmp3lame",
            "-crf",
            "27",
            "-preset",
            "veryfast",
            "-movflags",
            "frag_keyframe+empty_moov",
            "-f",
            "mp4",
         ],
      };

      const ffmpegOption = [
         ...ffmepgInputOption.video,
         "-loglevel",
         "error",
         "-",
      ];

      const ffmpegProcess = spawn(ffmpegPath, ffmpegOption, {
         stdio: ["pipe", "pipe", "pipe", "pipe", "pipe"],
      });

      const errorHendle = (err) => console.log(err);

      forEach(streams, (stream, format) => {
         const dest = ffmpegProcess.stdio[pipes[format]];
         stream.pipe(dest).on("error", errorHendle);
      });

      ffmpegProcess.stdio[pipes.out].pipe(res);

      let ffmpegLog = "";

      ffmpegProcess.stdio[pipes.err].on(
         "data",
         (chunk) => (ffmpegLog += chunk.toString())
      );

      ffmpegProcess.on("exit", (exitCode) => {
         if (exitCode === 1) {
            console.log(ffmpegLog);
         }
         res.end();
      });

      ffmpegProcess.on("close", () => ffmpegProcess.kill());

      const filename = `${encodeURI(sanitize(title))}.mp4`;

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader(
         "Content-Disposition",
         `attachment;filename=${filename};filename*=uft-8''${filename}`
      );
   } catch (err) {
      console.log(err);
   }
});

app.listen(port, () => {
   console.log(`Server is running. . .on  ${port}`);
});
