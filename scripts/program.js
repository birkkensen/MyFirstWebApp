const checkIfElementExists = (element) => {
  if (document.querySelector(element)) {
    return document.querySelector(element);
  } else {
    console.log("Element does not exist");
  }
};
const DOMElements = {
  image: checkIfElementExists(".program-image"),
  channelName: checkIfElementExists(".channel-name"),
  channelType: checkIfElementExists(".channel-type"),
  audio: checkIfElementExists(".audio-controls"),
  playButton: checkIfElementExists(".play-button img"),
  nowPlayingStart: checkIfElementExists(".now-playing-start"),
  nowPlayingEnd: checkIfElementExists(".now-playing-end"),
  nowPlayingText: checkIfElementExists(".now-playing h4"),
  playBtnImage: checkIfElementExists(".play-button img"),
  progressBar: checkIfElementExists(".progress-bar"),
};

const findQuery = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

const createLiveAudioFromId = async () => {
  const id = JSON.parse(findQuery("id"));
  const program = await fetchFromApi(`http://api.sr.se/api/v2/channels/${id}?format=json`);
  const nowPlaying = await fetchFromApi(
    `http://api.sr.se/api/v2/playlists/rightnow?channelid=${id}&format=json`
  );
  const talkShow = await fetchFromApi(
    program.channel.scheduleurl + "&format=json&pagination=false"
  );
  console.log(program);
  let audioIsPlaying = checkIfASongIsPlayingAndReturnMS(nowPlaying, talkShow);
  if (audioIsPlaying) {
    createHTMLFirstTime(program, audioIsPlaying, nowPlaying);
  } else {
    talkShowIsPlaying(talkShow, program);
  }
  setInterval(() => {
    audioIsPlaying = checkIfASongIsPlayingAndReturnMS(nowPlaying, talkShow);
    if (audioIsPlaying) {
      fetchNowPlayingAndUpdate(id, audioIsPlaying);
      console.log("song is playing");
    } else {
      talkShowIsPlaying(talkShow, program);
      console.log("song is not playing");
    }
  }, 5000);
  // update the progress bar using the songIsPlaying object from left to right
};

const updateProgressBar = (start, end) => {
  const progressBar = document.querySelector(".progress-container");
  const currentTime = new Date().getTime() - start;
  const duration = end - start;
  const progress = (currentTime / duration) * 100;
  DOMElements.progressBar.value = progress;
};

const createHTMLFirstTime = (program, audioIsPlaying, nowPlaying) => {
  DOMElements.image.src = program.channel.image;
  DOMElements.channelName.innerHTML = `Sveriges radio ${program.channel.name}`;
  DOMElements.channelType.innerHTML = program.channel.channeltype;
  DOMElements.nowPlayingStart.innerHTML = milliSecondsToLocalTimeInHoursAndMinutes(
    JSON.parse(audioIsPlaying.start)
  );
  DOMElements.nowPlayingEnd.innerHTML = milliSecondsToLocalTimeInHoursAndMinutes(
    JSON.parse(audioIsPlaying.end)
  );
  DOMElements.nowPlayingText.innerHTML = checkIfASongIsPlaying(nowPlaying);
  if (DOMElements.audio.src === "") DOMElements.audio.src = program.channel.liveaudio.url;
  setInterval(() => {
    updateProgressBar(audioIsPlaying.start, audioIsPlaying.end);
  }, 100);
};

const talkShowIsPlaying = (talkShow, audio) => {
  talkShow.schedule.forEach((program) => {
    if (
      removeDateStuff(program.starttimeutc) < new Date().getTime() &&
      removeDateStuff(program.endtimeutc) > new Date().getTime()
    ) {
      createTalkShowHTML(program, audio);
    }
  });
};

const createTalkShowHTML = (program, audio) => {
  const start = removeDateStuff(program.starttimeutc);
  const end = removeDateStuff(program.endtimeutc);
  DOMElements.image.src = program.imageurl ? program.imageurl : audio.channel.image;
  DOMElements.channelName.innerHTML = `Sveriges radio ${program.title}`;
  DOMElements.channelType.innerHTML = program.description;
  DOMElements.nowPlayingStart.innerHTML = milliSecondsToLocalTimeInHoursAndMinutes(start);
  DOMElements.nowPlayingEnd.innerHTML = milliSecondsToLocalTimeInHoursAndMinutes(end);
  if (DOMElements.audio.src === "") DOMElements.audio.src = audio.channel.liveaudio.url;

  setInterval(() => {
    updateProgressBar(removeDateStuff(program.starttimeutc), removeDateStuff(program.endtimeutc));
  }, 100);
};

const fetchNowPlayingAndUpdate = async (id, songIsPlaying) => {
  const nowPlaying = await fetchFromApi(
    `http://api.sr.se/api/v2/playlists/rightnow?channelid=${id}&format=json`
  );
  DOMElements.nowPlayingStart.innerHTML = milliSecondsToLocalTimeInHoursAndMinutes(
    JSON.parse(songIsPlaying.start)
  );
  DOMElements.nowPlayingEnd.innerHTML = milliSecondsToLocalTimeInHoursAndMinutes(
    JSON.parse(songIsPlaying.end)
  );
  DOMElements.nowPlayingText.innerHTML = checkIfASongIsPlaying(nowPlaying);
  setInterval(() => {
    updateProgressBar(removeDateStuff(songIsPlaying.start), removeDateStuff(songIsPlaying.end));
  }, 100);
};
const pausePlay = () => {
  if (DOMElements.audio.paused) {
    DOMElements.audio.play();
    DOMElements.playBtnImage.src = "../images/pause.svg";
  } else {
    DOMElements.audio.pause();
    DOMElements.playBtnImage.src = "../images/play.svg";
  }
};

const milliSecondsToLocalTimeInHoursAndMinutes = (milliSeconds) => {
  const date = new Date(milliSeconds);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours < 10 ? "0" + hours : hours}:${minutes < 10 ? "0" + minutes : minutes}`;
};

const checkIfASongIsPlaying = (nowPlaying) => {
  console.log(nowPlaying);
  if (nowPlaying.playlist.song) {
    return nowPlaying.playlist.song.description;
  } else {
    return "Inget spelas just nu";
  }
};

const removeDateStuff = (string) => {
  return JSON.parse(string.replace(/[^0-9\.]+/g, ""));
};

const checkIfASongIsPlayingAndReturnMS = (nowPlaying, talkShow) => {
  if (nowPlaying.playlist.song) {
    return {
      start: nowPlaying.playlist.song.starttimeutc.replace(/[^0-9\.]+/g, ""),
      end: nowPlaying.playlist.song.stoptimeutc.replace(/[^0-9\.]+/g, ""),
    };
  } else if (talkShow.schedule) {
    talkShow.schedule.forEach((program) => {
      if (
        removeDateStuff(program.starttimeutc) < new Date().getTime() &&
        removeDateStuff(program.endtimeutc) > new Date().getTime()
      ) {
        return {
          start: removeDateStuff(program.starttimeutc),
          end: removeDateStuff(program.endtimeutc),
        };
      }
    });
  }
};
