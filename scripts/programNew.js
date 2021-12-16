let progressInterval;
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
  channelType: checkIfElementExists(".channel-description"),
  audio: checkIfElementExists(".audio-controls"),
  playButton: checkIfElementExists(".play-button img"),
  nowPlayingStart: checkIfElementExists(".now-playing-start"),
  nowPlayingEnd: checkIfElementExists(".now-playing-end"),
  nowPlayingText: checkIfElementExists(".now-playing h4"),
  playBtnImage: checkIfElementExists(".play-button img"),
  progressBar: checkIfElementExists(".progress-bar"),
  animation1: checkIfElementExists(".now-playing img"),
  animation2: checkIfElementExists(".now-playing h4"),
};

const findQuery = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

const createLiveAudioFromId = async () => {
  const id = JSON.parse(findQuery("id"));
  const currentProgramPlaying = await fetchFromApi(
    `http://api.sr.se/api/v2/channels/${id}?format=json`
  );
  const playingRightNow = await fetchFromApi(
    `http://api.sr.se/api/v2/playlists/rightnow?channelid=${id}&format=json`
  );
  const scheduleForProgram = await fetchFromApi(
    `http://api.sr.se/v2/scheduledepisodes?channelid=${id}&format=json&pagination=false`
  );
  console.log(currentProgramPlaying);
  if (scheduleForProgram) {
    createHTML({ scheduleForProgram, currentProgramPlaying, playingRightNow });
  }
  updateHTML();
  setInterval(updateHTML, 5000);
};

const createHTML = (data) => {
  data.scheduleForProgram.schedule.forEach((program) => {
    if (
      removeDateStuff(program.starttimeutc) < new Date().getTime() &&
      removeDateStuff(program.endtimeutc) > new Date().getTime()
    ) {
      const starttimeutc = removeDateStuff(program.starttimeutc);
      const endtimeutc = removeDateStuff(program.endtimeutc);
      DOMElements.image.src = program.imageurl
        ? program.imageurl
        : data.currentProgramPlaying.channel.image;
      DOMElements.image.alt = program.program.name;
      DOMElements.channelName.innerHTML = program.title;
      DOMElements.channelType.innerHTML = program.description;
      DOMElements.nowPlayingStart.innerHTML = msToLocalTime(starttimeutc);
      DOMElements.nowPlayingEnd.innerHTML = msToLocalTime(endtimeutc);
      DOMElements.nowPlayingText.innerHTML = program.title;
      DOMElements.audio.src = data.currentProgramPlaying.channel.liveaudio.url;
      DOMElements.audio.currentTime += 70;
    }
  });
};

const updateHTML = async () => {
  const id = JSON.parse(findQuery("id"));
  const playingRightNow = await fetchFromApi(
    `http://api.sr.se/api/v2/playlists/rightnow?channelid=${id}&format=json`
  );
  const scheduleForProgram = await fetchFromApi(
    `http://api.sr.se/v2/scheduledepisodes?channelid=${id}&format=json&pagination=false`
  );
  if (playingRightNow.playlist.song) {
    musicPlayingHTML(playingRightNow);
  } else {
    scheduledHTML(scheduleForProgram);
  }
};

const musicPlayingHTML = (data) => {
  console.log(data);
  DOMElements.animation1.style = "animation-play-state: running;";
  DOMElements.animation2.style = "animation-play-state: running;";
  const starttimeutc = removeDateStuff(data.playlist.song.starttimeutc);
  const endtimeutc = removeDateStuff(data.playlist.song.stoptimeutc);
  DOMElements.nowPlayingStart.innerHTML = msToLocalTime(starttimeutc);
  DOMElements.nowPlayingEnd.innerHTML = msToLocalTime(endtimeutc);
  DOMElements.nowPlayingText.innerHTML = data.playlist.song.description;

  if (data.playlist.song) {
    clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      updateProgressBar(starttimeutc, endtimeutc);
    }, 1000);
  }
};

const scheduledHTML = (data) => {
  console.log(data);
  DOMElements.animation1.style = "animation-play-state: paused;";
  DOMElements.animation2.style = "animation-play-state: paused;";
  data.schedule.forEach((program) => {
    if (
      removeDateStuff(program.starttimeutc) < new Date().getTime() &&
      removeDateStuff(program.endtimeutc) > new Date().getTime()
    ) {
      const starttimeutc = removeDateStuff(program.starttimeutc);
      const endtimeutc = removeDateStuff(program.endtimeutc);
      DOMElements.nowPlayingStart.innerHTML = msToLocalTime(starttimeutc);
      DOMElements.nowPlayingEnd.innerHTML = msToLocalTime(endtimeutc);
      DOMElements.nowPlayingText.innerHTML = program.title;
      if (progressInterval) {
        return;
      } else {
        progressInterval = setInterval(() => {
          updateProgressBar(starttimeutc, endtimeutc);
        }, 1000);
      }
    }
  });
};

const removeDateStuff = (string) => {
  return JSON.parse(string.replace(/[^0-9\.]+/g, ""));
};

const msToLocalTime = (ms) => {
  const date = new Date(ms);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours < 10 ? "0" + hours : hours}:${minutes < 10 ? "0" + minutes : minutes}`;
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

const goBackToStart = () => {
  DOMElements.audio.currentTime = 0;
};
const goToLivePosition = () => {
  // Returns infinite amout of time :0
  console.log(DOMElements.audio.duration);
  console.log(DOMElements.audio.currentTime);
};

const updateProgressBar = (start, end) => {
  const currentTime = new Date().getTime() - start;
  const duration = end - start;
  const progress = (currentTime / duration) * 100;
  DOMElements.progressBar.value = progress;
  //Clear interval if song is over
  if (progress >= 100) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
};
