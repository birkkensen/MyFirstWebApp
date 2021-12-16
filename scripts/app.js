const SR_URL_LIVE = "http://api.sr.se/api/v2/channels?pagination=false&format=json";

const fetchFromApi = async (url) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log("Something has gone wrong ", error);
  }
};

const createPrograms = async () => {
  const programs = await fetchFromApi(SR_URL_LIVE);
  for (let i = 0; i < 5; i++) {
    if (programs.channels[i].image != undefined) {
      createHorizontalHTML(programs.channels[i]);
    }
  }
  for (let i = 5; i < programs.channels.length; i++) {
    if (programs.channels[i].image != undefined) {
      createVerticalHTML(programs.channels[i]);
    }
  }
};

const createHorizontalHTML = (data) => {
  let container = document.querySelector(".horizontal-container");
  container.innerHTML += `
  <a class="link-to-live" href="./program/?id=${data.id}">
    <div class="program-horizontal">
      <img class="program-image-horizontal" src="${data.image}" alt="programImage">  
      <h4>Sveriges radio ${data.name}</h4>
    </div>
  </a>
`;
};
const createVerticalHTML = (data) => {
  let container = document.querySelector(".vertical-container");
  container.innerHTML += `
  <a class="link-to-live" href="./program/?id=${data.id}">
    <div class="program-vertical">
        <img class="program-image-vertical" src="${data.image}" alt="programImage"> 
      <div class="description"> 
        <h4>Sveriges radio ${data.name}</h4>
        <h5 class="type">${data.channeltype}</h5>
      </div>
    </div>
  </a>
`;
};
