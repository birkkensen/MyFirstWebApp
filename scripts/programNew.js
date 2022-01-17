/**
 *
 * @param {*} element Takes an element from the DOM you want to check
 * @returns - The chosen element in document.querySelector(element) else Logged that it doesnt exist
 */
const checkIfElementExists = (element) => {
  if (document.querySelector(element)) {
    return document.querySelector(element);
  } else {
    console.log(element);
    console.log("Element does not exist");
  }
};

let progressInterval;
const DOMElements = {
  image: checkIfElementExists(".program-image"),
  channelName: checkIfElementExists(".channel-name"),
  channelType: checkIfElementExists(".channel-description"),
  audio: checkIfElementExists(".audio-controls"),
  // playButton: checkIfElementExists(".play-button img"),
  nowPlayingStart: checkIfElementExists(".now-playing-start"),
  nowPlayingEnd: checkIfElementExists(".now-playing-end"),
  nowPlayingText: checkIfElementExists(".now-playing h4"),
  playBtnImage: checkIfElementExists(".play-pause-button img"),
  progressBar: checkIfElementExists(".progress-bar"),
  animation1: checkIfElementExists(".now-playing img"),
  animation2: checkIfElementExists(".now-playing h4"),
};

/**
 *
 * @param {*} param - Gets the value from the searchbar you want. Ex {?id=123} passing in id gets you '123'
 * @returns - The value from the searchbar you pass in
 */
const findQuery = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

// TODO: Error handle if the show doesnt have a schedule, not sure all have one
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
  if (scheduleForProgram) {
    createHTML({ scheduleForProgram, currentProgramPlaying, playingRightNow });
  }
  updateHTML();
  setInterval(updateHTML, 5000);
};

/**
 * TODO: Break up function maybe? - Make the HTML in to a seperate one
 * @param {*} data - Object of all three fetches made in the createLiveAudioFromId() function.
 */
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

/**
 *
 * @param {*} data - Data from playing right now fetch
 */
const musicPlayingHTML = (data) => {
  checkAnimation(data.playlist.song.description);
  const starttimeutc = removeDateStuff(data.playlist.song.starttimeutc);
  const endtimeutc = removeDateStuff(data.playlist.song.stoptimeutc);
  DOMElements.nowPlayingStart.innerHTML = msToLocalTime(starttimeutc);
  DOMElements.nowPlayingEnd.innerHTML = msToLocalTime(endtimeutc);
  DOMElements.nowPlayingText.innerHTML = data.playlist.song.description;

  if (data.playlist.song) {
    clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      updateProgressBar(starttimeutc, endtimeutc);
    }, 10);
  }
};

/**
 *
 * @param {*} data - Data from scheduled programs fetch
 */
const scheduledHTML = (data) => {
  console.log(data);
  data.schedule.forEach((program) => {
    if (
      removeDateStuff(program.starttimeutc) < new Date().getTime() &&
      removeDateStuff(program.endtimeutc) > new Date().getTime()
    ) {
      checkAnimation(program.title);
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

/**
 * TODO: Better naming
 * @param {*} string - Check the lenght of the currently playing string if it needs to move.
 */
const checkAnimation = (string) => {
  console.log(string);
  if (string.length > 40) {
    DOMElements.animation1.classList.add("animation");
    DOMElements.animation2.classList.add("animation");
  } else {
    DOMElements.animation1.classList.remove("animation");
    DOMElements.animation2.classList.remove("animation");
  }
};

/**
 *
 * @param {*} string - Remove all the unnecessary stuff coming from SR-APi. Example: /Date(1639719600000)/
 * @returns milliseconds as a number instead
 */
const removeDateStuff = (string) => {
  return JSON.parse(string.replace(/[^0-9\.]+/g, ""));
};

/**
 *
 * @param {*} ms - Date in milliseconds
 * @returns Date as a string with hours and minutes
 */
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
    DOMElements.playBtnImage.alt = "Pause the audio";
    updateHTML();
  } else {
    DOMElements.audio.pause();
    DOMElements.playBtnImage.src = "../images/play.svg";
    DOMElements.playBtnImage.alt = "Play the audio";
  }
};

const goBackToStart = () => {
  DOMElements.audio.currentTime = 0;
};
// TODO: Make this button work so it can fetch the live position
const goToLivePosition = () => {
  // Returns infinite amout of time :0
  console.log(DOMElements.audio.duration);
  console.log(DOMElements.audio.currentTime);
};

/**
 *
 * @param {*} start - Start of the playing audio in milliseconds
 * @param {*} end - End of the playing audio in milliseconds
 */
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
