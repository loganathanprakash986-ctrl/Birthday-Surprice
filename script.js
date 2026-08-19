"use strict";

const MAX_PHOTOS = 15;

const $ = (id) => document.getElementById(id);

let selectedPhotos = [];
let selectedMusic = null;


/* =========================
   ENCODE / DECODE
========================= */

function encodeData(data) {
  const json = JSON.stringify(data);

  const bytes = new TextEncoder().encode(json);

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}


function decodeData(encoded) {
  try {
    let base64 = encoded
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    while (base64.length % 4) {
      base64 += "=";
    }

    const binary = atob(base64);

    const bytes = Uint8Array.from(
      binary,
      (char) => char.charCodeAt(0)
    );

    const json = new TextDecoder().decode(bytes);

    return JSON.parse(json);

  } catch (error) {
    console.error("Decode error:", error);
    return null;
  }
}


/* =========================
   COMPRESS IMAGE
========================= */

function compressImage(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {

      const img = new Image();

      img.onload = () => {

        let width = img.naturalWidth;
        let height = img.naturalHeight;

        const MAX_SIZE = 500;

        if (Math.max(width, height) > MAX_SIZE) {

          if (width > height) {

            height = Math.round(
              height * MAX_SIZE / width
            );

            width = MAX_SIZE;

          } else {

            width = Math.round(
              width * MAX_SIZE / height
            );

            height = MAX_SIZE;
          }
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        const result = canvas.toDataURL(
          "image/jpeg",
          0.45
        );

        resolve(result);
      };

      img.onerror = () => {
        reject(new Error("Image could not be loaded"));
      };

      img.src = reader.result;
    };

    reader.onerror = () => {
      reject(new Error("File could not be read"));
    };

    reader.readAsDataURL(file);
  });
}


/* =========================
   PHOTOS
========================= */

const photoInput = $("photos");

if (photoInput) {

  photoInput.addEventListener(
    "change",
    async function () {

      selectedPhotos = [];

      $("preview").innerHTML = "";

      $("photoCount").textContent =
        "Processing photos... 📸";

      const files = Array.from(this.files)
        .filter(file => file.type.startsWith("image/"))
        .slice(0, MAX_PHOTOS);

      if (this.files.length > MAX_PHOTOS) {

        alert(
          "Maximum 15 photos only 📸"
        );
      }

      for (const file of files) {

        try {

          const compressed =
            await compressImage(file);

          selectedPhotos.push(compressed);

          const img =
            document.createElement("img");

          img.src = compressed;
          img.alt = "Selected photo";

          $("preview").appendChild(img);

          $("photoCount").textContent =
            `${selectedPhotos.length} / ${MAX_PHOTOS} photos selected`;

        } catch (error) {

          console.error(
            "Photo error:",
            error
          );
        }
      }

      if (selectedPhotos.length === 0) {

        $("photoCount").textContent =
          "0 / 15 photos selected";
      }
    }
  );
}


/* =========================
   MUSIC
========================= */

const musicInput = $("music");

if (musicInput) {

  musicInput.addEventListener(
    "change",
    function () {

      const file = this.files[0];

      if (!file) {
        selectedMusic = null;
        return;
      }

      if (!file.type.startsWith("audio/")) {

        alert(
          "Please select an audio file 🎵"
        );

        this.value = "";
        selectedMusic = null;

        return;
      }

      selectedMusic = file;

    }
  );
}


/* =========================
   FILE TO BASE64
========================= */

function fileToDataURL(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(
        new Error("Music file could not be read")
      );
    };

    reader.readAsDataURL(file);
  });
}


/* =========================
   CREATOR
========================= */

const createBtn = $("createBtn");

if (createBtn) {

  createBtn.addEventListener(
    "click",
    async function () {

      const name =
        $("name").value.trim();

      const password =
        $("password").value;

      const message =
        $("message").value.trim();


      if (!name) {

        alert(
          "Please enter recipient name 💗"
        );

        $("name").focus();

        return;
      }


      if (!password) {

        alert(
          "Please create a secret password 🔐"
        );

        $("password").focus();

        return;
      }


      if (selectedPhotos.length === 0) {

        alert(
          "Please select at least one photo 📸"
        );

        return;
      }


      createBtn.disabled = true;

      createBtn.textContent =
        "Creating Surprise... 💗";


      try {

        let musicData = null;

        if (selectedMusic) {

          musicData =
            await fileToDataURL(
              selectedMusic
            );
        }


        const surpriseData = {

          name: name,

          password: password,

          message:
            message ||
            "Wishing you a very happy birthday! 🎂❤️",

          photos:
            selectedPhotos.slice(
              0,
              MAX_PHOTOS
            ),

          music:
            musicData

        };


        const encoded =
          encodeData(
            surpriseData
          );


        const baseURL =
          window.location.href
            .split("#")[0];


        const shareLink =
          baseURL +
          "#" +
          encoded;


        $("shareLink").value =
          shareLink;


        $("linkBox")
          .classList
          .remove("hidden");


        $("linkBox")
          .scrollIntoView({
            behavior: "smooth",
            block: "center"
          });


      } catch (error) {

        console.error(error);

        alert(
          "Link create panna mudiyala 😭\nPlease try with fewer/smaller photos."
        );

      }


      createBtn.disabled = false;

      createBtn.textContent =
        "Create Surprise Link ✨";

    }
  );
}


/* =========================
   COPY LINK
========================= */

const copyBtn = $("copyBtn");

if (copyBtn) {

  copyBtn.addEventListener(
    "click",
    async function () {

      const link =
        $("shareLink").value;

      if (!link) return;


      try {

        await navigator.clipboard.writeText(
          link
        );

        this.textContent =
          "Copied! ❤️";

        setTimeout(() => {

          this.textContent =
            "Copy Link ❤️";

        }, 2000);

      } catch (error) {

        $("shareLink").focus();

        $("shareLink").select();

        alert(
          "Link selected. Long press and copy 📋"
        );
      }
    }
  );
}


/* =========================
   LOAD SHARE LINK
========================= */

function getSharedData() {

  const hash =
    window.location.hash.substring(1);

  if (!hash) {
    return null;
  }

  return decodeData(hash);
}


const sharedData =
  getSharedData();


/* =========================
   SHOW PASSWORD PAGE
========================= */

if (sharedData) {

  $("creator")
    .classList
    .add("hidden");

  $("passwordPage")
    .classList
    .remove("hidden");

  $("recipientName")
    .textContent =
    sharedData.name ||
    "Someone Special";
}


/* =========================
   UNLOCK SURPRISE
========================= */

const unlockBtn =
  $("unlockBtn");

if (unlockBtn) {

  unlockBtn.addEventListener(
    "click",
    async function () {

      if (!sharedData) {
        return;
      }


      const enteredPassword =
        $("unlockPassword").value;


      if (
        enteredPassword !==
        sharedData.password
      ) {

        $("error").textContent =
          "Wrong password 😭💔";

        $("unlockPassword").focus();

        return;
      }


      $("error").textContent = "";


      $("passwordPage")
        .classList
        .add("hidden");


      $("surprisePage")
        .classList
        .remove("hidden");


      $("surpriseName")
        .textContent =
        sharedData.name;


      $("surpriseMessage")
        .textContent =
        sharedData.message;


      createGallery(
        Array.isArray(
          sharedData.photos
        )
          ? sharedData.photos
          : []
      );


      if (sharedData.music) {

        $("backgroundMusic").src =
          sharedData.music;

        $("musicBtn")
          .classList
          .remove("hidden");

        try {

          $("backgroundMusic").volume =
            0.65;

          await $("backgroundMusic").play();

          $("musicBtn").textContent =
            "🔊 Music On";

        } catch (error) {

          $("musicBtn").textContent =
            "🎵 Play Music";
        }
      }


      startConfetti();
    }
  );
}


/* =========================
   ENTER PASSWORD
========================= */

const unlockPassword =
  $("unlockPassword");

if (unlockPassword) {

  unlockPassword.addEventListener(
    "keydown",
    function (event) {

      if (event.key === "Enter") {

        event.preventDefault();

        $("unlockBtn").click();
      }
    }
  );
}


/* =========================
   GALLERY
========================= */

function createGallery(images) {

  const gallery =
    $("gallery");

  gallery.innerHTML = "";


  const rotations = [
    "-3deg",
    "2deg",
    "-2deg",
    "3deg",
    "-1deg"
  ];


  images
    .slice(0, MAX_PHOTOS)
    .forEach((src, index) => {

      const card =
        document.createElement("div");

      card.className =
        "photo-card";


      card.style.setProperty(
        "--rotation",
        rotations[
          index %
          rotations.length
        ]
      );


      const img =
        document.createElement("img");

      img.src = src;

      img.alt =
        `Memory ${index + 1}`;

      img.loading = "lazy";

      img.decoding = "async";


      card.appendChild(img);

      gallery.appendChild(card);
    });
}


/* =========================
   MUSIC BUTTON
========================= */

const musicBtn =
  $("musicBtn");

const backgroundMusic =
  $("backgroundMusic");


if (musicBtn && backgroundMusic) {

  musicBtn.addEventListener(
    "click",
    async function () {

      try {

        if (backgroundMusic.paused) {

          await backgroundMusic.play();

          this.textContent =
            "🔊 Music On";

        } else {

          backgroundMusic.pause();

          this.textContent =
            "🎵 Play Music";
        }

      } catch (error) {

        console.error(
          "Music error:",
          error
        );

        alert(
          "Music play aagala. Please try again 🎵"
        );
      }
    }
  );
}


/* =========================
   CONFETTI
========================= */

function startConfetti() {

  const emojis = [
    "🎉",
    "💗",
    "✨",
    "🎈",
    "🌸",
    "🥳",
    "💕"
  ];


  for (let i = 0; i < 35; i++) {

    const item =
      document.createElement("span");


    item.textContent =
      emojis[
        Math.floor(
          Math.random() *
          emojis.length
        )
      ];


    item.style.position =
      "fixed";

    item.style.left =
      Math.random() * 100 + "vw";

    item.style.top =
      "-40px";

    item.style.fontSize =
      18 +
      Math.random() * 20 +
      "px";

    item.style.zIndex =
      "9999";

    item.style.pointerEvents =
      "none";

    item.style.transition =
      "transform 3s linear, opacity 3s";


    document.body.appendChild(item);


    requestAnimationFrame(() => {

      item.style.transform =
        `translateY(110vh) rotate(${
          Math.random() * 600
        }deg)`;

      item.style.opacity = "0";

    });


    setTimeout(() => {

      item.remove();

    }, 3200);
  }
}
