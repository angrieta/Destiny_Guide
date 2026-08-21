const newSlide = new Swiper('.bazaar_slide',{
    //속성
    loop:true, //무한 반복 설정
    slidesPerView:4.5,  //한번에 표시되는 슬라이드 개수
    //(위)표시 슬라이드 개수보다 실제 슬라이드 개수가 많아야함 !!
    spaceBetween: 16,
    slidesPerGroup:1,
    centeredSlides: false,   // ← 이거 반드시 꺼야 함
    initialSlide: 2,         // ← 첫번째 슬라이드부터            // ← 루프 켜면 다시 중앙정렬됨
    watchOverflow: true,
    centeredSlides:true,
    simulateTouch: true,
    passiveListeners: false,           // iOS/안드로이드에서 터치 대응 개선되는 경우 있음

    threshold: 8,                      // 살짝 드래그 했을 때만 슬라이드로 인식(클릭 오작동 감소)
    resistanceRatio: 0.85,

    watchSlidesProgress: true,
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
    // 슬라이드 클릭 요소가 많으면 이것도 도움됨
    preventClicks: false,
    navigation: {
        nextEl: ".bazaar_inner .swiper-button-next",
        prevEl: ".bazaar_inner .swiper-button-prev",
    },
    breakpoints: {
        1920: {
            slidesPerView: 5,
        },
        1024: {
            slidesPerView: 3.2, // ✅ 1500 미만 구간
        },
        700: {
            slidesPerView: 2.4, // ✅ 1500 미만 구간
        },
        450: {
            slidesPerView: 1.6, // ✅ 1500 미만 구간
        },
        0: {
            slidesPerView: 1.2, // 1024 이하
        }
    }    
});

// item_page 는 캐러셀 대신 검색 가능한 그리드를 쓴다(scripts/item_grid.js).
// 그 스크립트가 먼저 실행되어 .destiny_item_swiper 클래스를 떼어내지만,
// 로드 순서가 바뀌어도 캐러셀이 되살아나지 않도록 마커로 한 번 더 막는다.
if (!document.querySelector('[data-destiny-item-grid]')) {
document.querySelectorAll('.destiny_item_swiper').forEach(swiperEl => {
  const paginationEl = swiperEl.querySelector('.swiper-pagination');

  new Swiper(swiperEl, {
    loop: true,
    slidesPerView: 3,
    spaceBetween: 16,
    pagination: {
      el: paginationEl,
      type: 'progressbar',
    },
    keyboard: { enabled: true, onlyInViewport: true },
    threshold: 8,
    resistanceRatio: 0.85,
    watchSlidesProgress: true,
    preventClicks: true,
    preventClicksPropagation: true,
    breakpoints: {
      300: { slidesPerView: 1.2 },
      340: { slidesPerView: 1.3 },
      381: { slidesPerView: 1.5 },
      430: { slidesPerView: 1.8 },
      500: { slidesPerView: 2 },
      600: { slidesPerView: 2.5 },
      684: { slidesPerView: 2.8 },
      800: { slidesPerView: 3.2 },
      982: { slidesPerView: 3 },
      1200: { slidesPerView: 4 },
      1440: { slidesPerView: 5 },
      1920: { slidesPerView: 6.7 },
    }
  });
});
}


$('.header_menu').show();
$('.submenu').hide();
$('.menu-item').click(function(){
    $('.submenu').slideUp();
    $(this).next('.submenu').slideDown();
})
$('.menu_close').click(function(){
    $('.header_menu')
    .animate({left:'-50%'},300)
})
$('.inner .right_menu').click(function(){
    $('.header_menu')
    .animate({left:'0'},300)
})


/* const popup = document.getElementById('itemPopup');
const dim = popup.querySelector('.popup_dim');
const btnClose = popup.querySelector('.popup_close');

const elTitle = popup.querySelector('.popup_title');
const elType  = popup.querySelector('.popup_type');
const elImg   = popup.querySelector('.popup_img img');
const elSymbols  = popup.querySelector('.popup_symbols');
const elInfos = popup.querySelector('.popup_infos');
const elSections = popup.querySelector('.popup_sections');

function openPopup(){
  popup.classList.add('open');
  document.body.classList.add('overflow-hidden');
  popup.setAttribute('aria-hidden', 'false');
}
function closePopup(){
  popup.classList.remove('open');
  document.body.classList.remove('overflow-hidden');
  popup.setAttribute('aria-hidden', 'true');
}

btnClose.addEventListener('click', closePopup);
dim.addEventListener('click', closePopup);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && popup.classList.contains('open')) closePopup();
});

function renderSections(key){
  elSections.innerHTML = '';
  const data = ITEM_DETAIL[key];
  if (!data || !data.sections) return;

  data.sections.forEach(sec => {
    const wrap = document.createElement('div');
    wrap.className = 'popup_section';
    wrap.innerHTML = `
      <h4 class="popup_section_title">${sec.title}</h4>
      <ul class="popup_section_list">
        ${sec.body.map(line => `<li>${line}</li>`).join('')}
      </ul>
    `;
    elSections.appendChild(wrap);
  });
}

document.querySelectorAll('.swiper-slide .item_box').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();

    const key = link.dataset.item;           // data-item 값
    const inner = link.querySelector('.item_inner');

    // 카드에서 기본 정보 뽑아서 팝업 상단에 표시
    const titleEl = inner.querySelector('.item_title');
    const typeEl  = titleEl?.querySelector('.item_type');

    const titleClone = titleEl ? titleEl.cloneNode(true) : null;
    if (titleClone && titleClone.querySelector('.item_type')) {
      titleClone.querySelector('.item_type').remove();
    }

    elTitle.textContent = titleClone ? titleClone.textContent.trim() : '';
    elType.textContent  = typeEl ? typeEl.textContent.trim() : '';

    const imgEl = inner.querySelector('.item_img img');
    elImg.src = imgEl ? imgEl.getAttribute('src') : '';
    elImg.alt = imgEl ? (imgEl.getAttribute('alt') || elTitle.textContent) : elTitle.textContent;

    // 심볼 복사
    elSymbols.innerHTML = '';
    inner.querySelectorAll('.Symbol_item').forEach(s => {
      elSymbols.appendChild(s.cloneNode(true));
    });

    // 카드에 보이는 item_info들 복사
    elInfos.innerHTML = '';
    inner.querySelectorAll('.item_info').forEach(p => {
      elInfos.appendChild(p.cloneNode(true));
    });

    // 핵심: 상세 섹션 렌더링
    renderSections(key);

    // 주입된 팝업 전용 문구에 번역을 적용한다 (아래쪽 블록과 같은 이유)
    window.DestinyI18n?.hydrate(document);

    openPopup();
  });
});

// 카드에 보이는 item_info들 복사
elInfos.innerHTML = '';
inner.querySelectorAll('.item_info').forEach(p => {
  elInfos.appendChild(p.cloneNode(true));
});

// ✅ 여기서 팝업 전용 info 추가
const data = ITEM_DETAIL[key];
if (data?.popupInfo?.length) {
  data.popupInfo.forEach(html => {
    elInfos.insertAdjacentHTML('beforeend', html);
  });
} */


const popup = document.getElementById('itemPopup');
if (popup) {
const dim = popup.querySelector('.popup_dim');
const btnClose = popup.querySelector('.popup_close');

const elTitle = popup.querySelector('.popup_title');
const elType  = popup.querySelector('.popup_type');
const elImg   = popup.querySelector('.popup_img img');
const elSymbols  = popup.querySelector('.popup_symbols');
const elInfos = popup.querySelector('.popup_infos');
const elSections = popup.querySelector('.popup_sections');

function openPopup(){
  popup.classList.add('open');
  document.body.classList.add('overflow-hidden');
  popup.setAttribute('aria-hidden', 'false');
}

function closePopup(){
  popup.classList.remove('open');
  document.body.classList.remove('overflow-hidden');
  popup.setAttribute('aria-hidden', 'true');
}

btnClose.addEventListener('click', closePopup);
dim.addEventListener('click', closePopup);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && popup.classList.contains('open')) closePopup();
});

function renderSections(key){
  elSections.innerHTML = '';
  const data = ITEM_DETAIL[key];
  if (!data?.sections) return;

  data.sections.forEach(sec => {
    const wrap = document.createElement('div');
    wrap.className = 'popup_section';
    wrap.innerHTML = `
      <h4 class="popup_section_title">${sec.title}</h4>
      <div class="popup_section_body">
        ${sec.body.join('')}
      </div>
    `;
    elSections.appendChild(wrap);
  });
}

document.querySelectorAll('.swiper-slide .item_box').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();

    const key = link.dataset.item;
    const inner = link.querySelector('.item_inner');
    const data = ITEM_DETAIL[key];
    if (!data) return;

    // 제목
    const titleEl = inner.querySelector('.item_title');
    const typeEl  = titleEl?.querySelector('.item_type');
    const titleClone = titleEl?.cloneNode(true);

    if (titleClone?.querySelector('.item_type')) {
      titleClone.querySelector('.item_type').remove();
    }

    elTitle.textContent = titleClone?.textContent.trim() || '';
    elType.textContent = typeEl?.textContent.trim() || '';

    // 이미지
    const imgEl = inner.querySelector('.item_img img');
    elImg.src = imgEl?.src || '';
    elImg.alt = imgEl?.alt || elTitle.textContent;

    // 심볼
    elSymbols.innerHTML = '';
    inner.querySelectorAll('.Symbol_item').forEach(s => {
      elSymbols.appendChild(s.cloneNode(true));
    });

    // item_info 초기화
    elInfos.innerHTML = '';

    // 카드 item_info 복사
    inner.querySelectorAll('.item_info').forEach(p => {
      elInfos.appendChild(p.cloneNode(true));
    });

    // ✅ popup 전용 info 추가
    if (data.popupInfo?.length) {
      data.popupInfo.forEach(html => {
        elInfos.insertAdjacentHTML('beforeend', html);
      });
    }

    // 상세 섹션
    renderSections(key);

    // 팝업 전용 문구는 item_info.js 의 HTML 문자열에서 새로 주입되므로
    // 여기서 한 번 번역을 적용해야 한다. 카드에서 복제한 노드는 이미 번역된 상태다.
    window.DestinyI18n?.hydrate(document);

    openPopup();
  });
});
}

let bestSwiperInstance

function initBestSwiper() {
  if (bestSwiperInstance) bestSwiperInstance.destroy(true, true)

  bestSwiperInstance = new Swiper(".best_slide", {
    scrollbar: {
        el: ".best_slide .event-scrollbar",
    },
    breakpoints: { 
        1920: {
            slidesPerView: 5.2,
            spaceBetween: 0,
        },
        1869: {
            slidesPerView: 5,
            spaceBetween: 0,
        },
        1800: {
            slidesPerView: 5.1,
            spaceBetween: 0,
        },
        1680: {
            slidesPerView: 4.7,
            spaceBetween: 0,
        },
        1570: {
            slidesPerView: 4.7,
            spaceBetween: 0,
        },
        1450: {
            slidesPerView: 3.9,
            spaceBetween: 30,
        },
        1400: {
            slidesPerView: 3.8,
            spaceBetween: 0,
        },
        1320: {
            slidesPerView: 3.8,
            spaceBetween: 0,
        },
        1285: {
            slidesPerView: 3.5,
            spaceBetween: 0,
        },
        1200: {
            slidesPerView: 3.2,
            spaceBetween: 0,
        },
        1170: {
            slidesPerView: 3.1,
            spaceBetween: 0,
        },
        983: {
            spaceBetween: 20,
            slidesPerView: 3,  //1024이하 일때
        },
        780: {
            spaceBetween: 15,
            slidesPerView: 2.8,  //1024이하 일때
        },
        630: {
            spaceBetween: 0,
            slidesPerView: 1.8,  //1024이하 일때
        },
        500: {
            spaceBetween: 0,
            slidesPerView: 1.6,  //1024이하 일때
        },
        400: {
            spaceBetween: 0,
            slidesPerView: 1.4,  //1024이하 일때
        },
        350: {
            spaceBetween: 0,
            slidesPerView: 1.2,  //1024이하 일때
        },
        300: {
            spaceBetween: 0,
            slidesPerView: 1.1,  //1024이하 일때
        }
    },
    loop:true, //무한 반복 설정
    slidesPerView:4.5,  //한번에 표시되는 슬라이드 개수
    //(위)표시 슬라이드 개수보다 실제 슬라이드 개수가 많아야함 !!
    slidesPerGroup:1,
    centeredSlides: false,   // ← 이거 반드시 꺼야 함
    initialSlide: 2,         // ← 첫번째 슬라이드부터            // ← 루프 켜면 다시 중앙정렬됨
    watchOverflow: true,
    centeredSlides:true,
    simulateTouch: true,
    passiveListeners: false,           // iOS/안드로이드에서 터치 대응 개선되는 경우 있음

    threshold: 8,                      // 살짝 드래그 했을 때만 슬라이드로 인식(클릭 오작동 감소)
    resistanceRatio: 0.85,

    watchSlidesProgress: true,
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
    // 슬라이드 클릭 요소가 많으면 이것도 도움됨
    navigation: {
        nextEl: ".bazaar_inner .swiper-button-next",
        prevEl: ".bazaar_inner .swiper-button-prev",
    },
  })
}

function initCharacterPopup() {
  const area = document.getElementById("best-slide-area")
  const modal = document.getElementById("characterPopup")
  if (!area || !modal) return

  const content = modal.querySelector(".character_popup_content")
  const closeButton = modal.querySelector(".character_popup_close")
  const dimmer = modal.querySelector(".character_popup_dim")
  let previousFocus = null

  const closeCharacterPopup = () => {
    modal.classList.remove("open")
    modal.setAttribute("aria-hidden", "true")
    document.body.classList.remove("overflow-hidden")
    previousFocus?.focus()
  }

  // 사전이 늦게 도착할 수 있고 언어도 바뀔 수 있으니, 라벨 설정을 함수로 빼서 다시 부른다.
  const applyCardLabels = () => {
    const template = window.DestinyI18n?.t("index.popup.open", "Open expanded {name} stats") ?? "Open expanded {name} stats"
    area.querySelectorAll(".swiper-slide > a").forEach(card => {
      const name = card.querySelector(".character_name")?.textContent.trim() || "character"
      card.setAttribute("aria-label", template.replace("{name}", name))
      card.setAttribute("aria-haspopup", "dialog")
    })
  }
  applyCardLabels()
  document.addEventListener("destiny-lang-change", applyCardLabels)

  area.addEventListener("click", event => {
    const card = event.target.closest(".swiper-slide > a")
    if (!card || !area.contains(card)) return

    event.preventDefault()
    previousFocus = card
    content.innerHTML = ""

    const expandedCard = card.cloneNode(true)
    expandedCard.removeAttribute("href")
    expandedCard.removeAttribute("aria-haspopup")
    expandedCard.removeAttribute("aria-label")
    expandedCard.setAttribute("tabindex", "-1")
    content.appendChild(expandedCard)

    modal.classList.add("open")
    modal.setAttribute("aria-hidden", "false")
    document.body.classList.add("overflow-hidden")
    closeButton.focus()
  })

  closeButton.addEventListener("click", closeCharacterPopup)
  dimmer.addEventListener("click", closeCharacterPopup)
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal.classList.contains("open")) {
      closeCharacterPopup()
    }
  })
}

const bestSlideArea = document.getElementById("best-slide-area")
if (bestSlideArea) {
  fetch("character_aria.html")
    .then(res => {
      if (!res.ok) throw new Error(`Character card request failed: ${res.status}`)
      return res.text()
    })
    .then(html => {
      bestSlideArea.innerHTML = html
      // 조각을 넣은 뒤 번역을 적용한다. 이걸 빼면 카드가 영어로 남는다.
      // hydrate 가 끝난 뒤에 초기화해야 팝업 라벨까지 번역된 상태로 잡힌다.
      Promise.resolve(window.DestinyI18n?.hydrate(bestSlideArea)).then(() => {
        initBestSwiper()
        initCharacterPopup()
      })
    })
    .catch(error => {
      console.error("Unable to load character cards.", error)
    })
}
