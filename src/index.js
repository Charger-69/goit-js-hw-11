import 'simplelightbox/dist/simple-lightbox.min.css';
import './css/styles.css';
import './css/search-field.css';
import './css/gallery.css';
import './css/load-more.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import GalleryApi from '../src/js/fetch-gallery';
import '../src/js/header.js';
import LoadMoreBtn from'../src/js/load-more-button';
import galleryCardTpl from '../src/templates/gallery-card.hbs';

const refs = {
    form: document.querySelector('form#search-form'),
    inputField: document.querySelector('input.search-form__input'),
    searchButton: document.querySelector('button.search-form__button'),
    gallery: document.querySelector('div.gallery'),
    loadMoreButton: document.querySelector('button.load-more'),
};

const loadMoreBtn = new LoadMoreBtn({
    selector: '[data-action="load-more"]',
    hidden: true,
});

const galleryApi = new GalleryApi();

refs.form.addEventListener('submit', onSearch);
loadMoreBtn.refs.button.addEventListener('click', fetchGallery);

function onSearch(event) {
    event.preventDefault();

    galleryApi.query = event.currentTarget.elements.searchQuery.value.trim();

    if (galleryApi.query === '') {
        clearAll();
        return Notify.info("Input your search query.");
    }

    loadMoreBtn.show();
    galleryApi.resetPage();
    clearGallery();
    fetchGallery();
}

async function fetchGallery() {
    try {
        loadMoreBtn.disable();
        const imagesResponse = await galleryApi.fetchGallery();
        const imagesData = imagesResponse.data;
        
        
        if (imagesData.hits.length === 0) {
            throw new Error();
        }
        
        galleryDisplay(imagesData);
        loadMoreBtn.enable();
        smoothScroll();
    } catch {
        noSuchResult();
    };
};

function galleryDisplay(images) {
    const imagesReturned = images.hits.length;
    const imagesHits = images.totalHits;
    let cardsDisplayed = document.querySelectorAll('div.photo-card').length;

    function statements() {
    if (imagesReturned < CARDS_PER_PAGE && imagesHits > CARDS_PER_PAGE) {
        Notify.info("We're sorry, but you've reached the end of search results.");
        loadMoreBtn.hide();
    }

    if (cardsDisplayed + CARDS_PER_PAGE > 500) {
        Notify.info("We're sorry, but you've reached the end of search results.");
        loadMoreBtn.hide();
        images.hits = images.hits.slice(0, 20);
    }

    if (imagesHits <= CARDS_PER_PAGE) {
        loadMoreBtn.hide();
    }

    if (cardsDisplayed < 1) {
        Notify.success(`Hooray! We found ${imagesHits} images.`);
        }
    }

    statements();   
    
    refs.gallery.insertAdjacentHTML('beforeend', galleryCardTpl(images));

    spaceBetweenNumbers();
    simpleLightbox();
    lazyLoad();
}

function clearGallery() {
    cardsCount = 0;
    refs.gallery.innerHTML = '';
}

function clearAll() {
    cardsCount = 0;
    refs.gallery.innerHTML = ' ';
    loadMoreBtn.hide();
};

function noSuchResult() {
    clearAll();
    Notify.failure("Sorry, there are no images matching your search query. Please try again.");
};

function simpleLightbox() {
    const galleryHandler = new SimpleLightbox('.photo-card a');
    galleryHandler.on('show.simplelightbox');
    galleryHandler.refresh();
}

function lazyLoad() {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    
    lazyImages.forEach(image => {
        image.addEventListener('load', onImageLoaded, { once: true });
    });
    
    function onImageLoaded(event) {
        event.target.classList.add('appear');
        event.target.classList.add('loaded');
    }
}

let cardsCount = 0;
function spaceBetweenNumbers() {
    let numbersCount = document.querySelectorAll('span.info-number').length;

    for (let i = cardsCount; i < numbersCount; i += 1){
        const amountEl = document.querySelectorAll('span.info-number')[i];
        amountEl.textContent = Number(amountEl.textContent).toLocaleString();
        cardsCount = i;
    };

    cardsCount += 1;
}


const CARDS_PER_PAGE = 40;
function smoothScroll() {
    let cardsAmount = document.querySelectorAll('div.photo-card').length;

    if ( cardsAmount > CARDS_PER_PAGE) {
        const { height: cardHeight } = document.querySelector('.gallery')
            .firstElementChild
            .getBoundingClientRect();
        
        window.scrollBy({
            top: cardHeight * 2,
            behavior: 'smooth',
        });
    }
}