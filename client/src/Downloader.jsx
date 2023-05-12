import axios from "axios";
import React, { useState } from "react";
import BeatLoader from "react-spinners/BeatLoader";
const Downloader = () => {
   const [link, setLink] = useState("");
   const [details, setDetails] = useState("");
   const [resu, setResu] = useState("");
   const [loader, setLoder] = useState(false);

   const handleDeatails = async (e) => {
      e.preventDefault();
      const videoId = link.split("https://youtu.be/")[1];

      try {
         setLoder(true);
         const { data } = await axios.get(
            `http://localhost:5000/api/get-video-info/${videoId}`
         );
         setDetails(data.videoInfo);
         setResu(data.videoInfo.lastResu);
         setLoder(false);
      } catch (error) {
         console.log(error);
      }
   };
   const handleDownloadVideo = () => {
      const videoId = link.split("https://youtu.be/")[1];
      const url = `http://localhost:5000/api/download?id=${videoId}&resu=${resu}`;
      window.location.href = url;
   };

   return (
      <div className="h-screen w-screen bg-slate-950   flex justify-center items-center px-6">
         <div className="bg-[#232322] p-6 rounded-lg">
            <h3 className="text-3xl font-serif font-semibold text-gray-100">
               Youtube Video Downloader
            </h3>
            <form onSubmit={handleDeatails} className="w-[420px]">
               <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="focus:outline-none rounded px-3 py-1.5 w-full mt-3 focus:border border-purple-600 placeholder:text-gray-950"
                  type="text"
                  placeholder="Enter your link...."
                  required
               />
               <button
                  type="submit"
                  className="bg-rose-600  font-mono font-semibold  px-6 py-1.5 rounded mt-3  text-gray-100"
               >
                  Submit
               </button>
            </form>

            {loader ? (
               <div className="mt-4 flex justify-center items-center">
                  <BeatLoader color="pink" size={20} />
               </div>
            ) : (
               <>
                  {details && (
                     <>
                        <div className="flex text-gray-100 mt-4">
                           <img
                              className="max-w-[300px] mr-3"
                              src={details.videoURL}
                              alt=""
                           />
                           <div>
                              <h4>{details.title}</h4>
                              <p className="mt-2 ">Duration: 30.00min</p>
                              <select
                                 required
                                 onChange={(e) => setResu(e.target.value)}
                                 className="text-gray-950 mt-2 focus:outline-none border border-green-600 w-[100px]"
                              >
                                 {details.videoResu.map((resu, i) => (
                                    <option key={i}>{resu}p</option>
                                 ))}
                              </select>
                           </div>
                        </div>
                        <div className="flex justify-end">
                           <button
                              onClick={handleDownloadVideo}
                              className="bg-rose-600 flex justify-end font-mono font-semibold  px-6 py-1.5 rounded mt-3  text-gray-100"
                           >
                              Download
                           </button>
                        </div>
                     </>
                  )}
               </>
            )}
         </div>
      </div>
   );
};

export default Downloader;
