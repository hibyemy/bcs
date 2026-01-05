---
layout: home
title: "Bowen Cloud Services - Reliable, grassroots cloud storage"
---

  <div>
    <div id="container">
      <div class="flex md:flex-row flex-col items-center md:items-end">
        <div class="flex-1">
<h1 class="text-4xl font-bold">
        <img alt="Bowen Cloud Services" src="/assets/images/bowen-archive.png" width="300px">
      </h1>
        </div>
        <div style="height: auto;display: block;align-content: end;margin-bottom: 10px;">
          <p id="time"></p>
        </div>
      </div>
      <hr style="clear:both;">
      <div class="mx-auto container">
        <h2 class="text-3xl m-2">Our Services</h2>
        <div style="overflow:clip;" class="flex flex-wrap sm:gap-4 justify-around sm:justify-normal">
            <div class="h-40 w-40 relative rounded-lg bg-sky-800"><a href="https://cloud.bowenchen.xyz">
                    <h3 class="z-10 absolute m-3 text-lg text-center text-gray-50">Nextcloud</h3>
                    <img class="transition-transform absolute z-20 h-full bg-sky-500 p-5 rounded-lg sm:hover:translate-y-12"
                        src="/assets/images/nextcloud-icon.svg">
                </a>
            </div>
            <div style="overflow:clip;" class="h-40 w-40 relative rounded-lg bg-gray-700"><a href="https://jellyfin.bowenchen.xyz">
                    <h3 class="z-10 absolute m-3 text-lg text-center text-gray-50">Jellyfin</h3>
                    <img class="transition-transform absolute z-20 h-full bg-slate-800 p-5 rounded-lg sm:hover:translate-y-12"
                        src="/assets/images/jellyfin-icon.svg">
                </a>
            </div>
        </div>
        <h2 class="text-3xl m-2 mt-4">Roadmap</h2>
        <ul class="mx-6">
            <li>To be announced.</li>
        </ul>
      </div>
      <hr class="my-5">
      <div class="mx-5">
        <p class="text-xs">
          &#169;2025 Bowen Cloud Services, Ltd.
        </p>
      </div>
    </div>

</div>

<script>
    const updateClock = () => {
        document.querySelector("#time").textContent = new Date().toLocaleString();
    }
    updateClock();
    setInterval(updateClock, 1000)
</script>
