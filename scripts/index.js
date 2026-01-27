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
    navigation: {
        nextEl: ".bazaar_inner .swiper-button-next",
        prevEl: ".bazaar_inner .swiper-button-prev",
    },
    breakpoints: {
        1920: {
            slidesPerView: 5,
        },
        1500: {
            slidesPerView: 5,
        },
        1024: {
            slidesPerView: 3.5, // ✅ 1500 미만 구간
        },
        700: {
            slidesPerView: 2.4, // ✅ 1500 미만 구간
        },
        0: {
            slidesPerView: 1, // 1024 이하
        }
    }    
});
const bestSlide = new Swiper('.best_slide',{
/*     autoplay:{
        delay:2000, //다음 슬라이드전환까지 대기시간
        disableOnInteraction:true, // 사용자 상호작용 상관없이 계속 진행
    }, */
    //속성
    loop:true, //무한 반복 설정
    slidesPerView: 2,  //한번에 표시되는 슬라이드 개수
    //(위)표시 슬라이드 개수보다 실제 슬라이드 개수가 많아야함 !!
    spaceBetween:0,
    //centeredSlides:true,
    scrollbar: {
        el: ".best_slide .event-scrollbar",
    },
    breakpoints: { 
        1920: {
            slidesPerView: 3.5,
            spaceBetween: 30,
        },
        1000: {
            slidesPerView: 3.5,
            spaceBetween: 30,
        },
        0: {
            spaceBetween: 13,
            slidesPerView: 1,  //1024이하 일때
        }
    }
});




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

    openPopup();
  });
});

let bestSwiperInstance

function initBestSwiper() {
  if (bestSwiperInstance) bestSwiperInstance.destroy(true, true)

  bestSwiperInstance = new Swiper(".best_slide", {
    slidesPerView: 2,  //한번에 표시되는 슬라이드 개수
    //(위)표시 슬라이드 개수보다 실제 슬라이드 개수가 많아야함 !!
    spaceBetween:0,
    //centeredSlides:true,
    scrollbar: {
        el: ".best_slide .event-scrollbar",
    },
    breakpoints: { 
        1920: {
            slidesPerView: 3.5,
            spaceBetween: 30,
        },
        1000: {
            slidesPerView: 3.5,
            spaceBetween: 30,
        },
        0: {
            spaceBetween: 13,
            slidesPerView: 3,  //1024이하 일때
        }
    },
    loop: true,
    pagination: { el: ".best_slide .swiper-pagination", clickable: true },
    navigation: {
      nextEl: ".best_slide .swiper-button-next",
      prevEl: ".best_slide .swiper-button-prev",
    },
  })
}

fetch("character_aria.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("best-slide-area").innerHTML = html
    initBestSwiper()
  })
