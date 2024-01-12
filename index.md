---
layout: home
title: "Bowen Cloud Services - Reliable, grassroots cloud storage"
---

<div class="bg-[#c97c17] p-10 mb-5 border-b-8 border-b-gray-300">
    <div class="mx-auto container">
        <h1 class="text-center text-4xl font-bold text-sky-50 uppercase">Bowen Cloud Services</h1>
        <hr class="mx-auto my-3 border-gray-300 w-[50%]">
        <p id="time" class="text-center ext-xl text-gray-100"></p>
    </div>
</div>

<div class="mx-auto container">
    <h2 class="text-3xl m-2">Our Services</h2>
    <div class="flex flex-wrap sm:gap-4 justify-around sm:justify-normal">
        <div class="h-40 w-40 relative rounded-lg bg-sky-800"><a href="https://cloud.bowenchen.xyz">
                <h3 class="z-10 absolute m-3 text-lg text-center text-gray-50">Nextcloud</h3>
                <img class="transition-transform absolute z-20 h-full bg-sky-500 p-5 rounded-lg sm:hover:translate-y-12"
                    src="assets/images/nextcloud-icon.svg">
            </a>
        </div>
        <div class="h-40 w-40 relative rounded-lg bg-gray-700"><a href="https://jellyfin.bowenchen.xyz">
                <h3 class="z-10 absolute m-3 text-lg text-center text-gray-50">Jellyfin</h3>
                <img class="transition-transform absolute z-20 h-full bg-slate-800 p-5 rounded-lg sm:hover:translate-y-12"
                    src="assets/images/jellyfin-icon.svg">
            </a>
        </div>
    </div>
    <h2 class="text-3xl m-2 mt-4">Roadmap</h2>
    <ul class="mx-6">
        <li>To be announced.</li>
    </ul>
</div>

<script>
    const updateClock = () => {
        document.querySelector("#time").innerHTML = new Date().toLocaleString();
    }
    updateClock();
    setInterval(updateClock, 1000)
</script>