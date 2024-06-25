let lunrIndex, pagesIndex;

// Funzione per inizializzare l'indice Lunr
function initLunr() {
  return new Promise((resolve) => {
    fetch('/index.json')
      .then(response => response.json())
      .then(pages => {
        pagesIndex = pages;
        lunrIndex = lunr(function() {
          this.ref('id');
          this.field('title', { boost: 10 });
          this.field('content');
          this.field('tags', { boost: 5 });

          pagesIndex.forEach(page => {
            this.add(page);
          });
        });
        console.log("Lunr index creato");
        resolve();
      })
      .catch(e => {
        console.error('Errore nel caricamento dell\'indice:', e);
        document.getElementById('main-search-results').innerHTML = '<p style="color: red;">Errore nel caricamento dei dati di ricerca</p>';
      });
  });
}

// Funzione per eseguire la ricerca
function search(query) {
  if (!query) {
    displayResults([]);
    return;
  }
  try {
    const results = lunrIndex.search(query + '*');
    console.log("Risultati della ricerca per '" + query + "':", results);
    displayResults(results);
  } catch (e) {
    console.error('Errore durante la ricerca:', e);
    displayResults([]);
  }
}

// Funzione per visualizzare i risultati
function displayResults(results) {
  const searchResults = document.getElementById('main-search-results');
  if (!searchResults) {
    console.error('Elemento main-search-results non trovato');
    return;
  }

  if (!results.length) {
    searchResults.innerHTML = '<p>Nessun risultato trovato</p>';
    return;
  }

  let resultsHtml = '';
  results.forEach((result, index) => {
    const page = pagesIndex.find(page => page.id === result.ref);
    if (page) {
      resultsHtml += `
        <div>
          <h2>${index + 1}. <a href="${page.url}">${page.title}</a></h2>
          <p>${page.content}</p>
          ${page.tags ? `<p>Tags: ${page.tags.join(', ')}</p>` : ''}
        </div>
      `;
    }
  });

  searchResults.innerHTML = resultsHtml;
}

// Funzione per aggiornare i metadati della pagina
function updateMetadata(query) {
  document.title = query
    ? `Risultati di ricerca per: ${query} — ${siteName}`
    : `Risultati di ricerca — ${siteName}`;

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', query
      ? `Risultati della ricerca per '${query}' su ${siteName}.`
      : `Pagina di ricerca per ${siteName}.`);
  }

  const newUrl = query
    ? `/search-results/?q=${encodeURIComponent(query)}`
    : '/search-results/';
  history.pushState({}, '', newUrl);
}

// Inizializzazione al caricamento del DOM
document.addEventListener('DOMContentLoaded', function() {
  initLunr().then(() => {
    const searchInput = document.getElementById('search-field-results');
    if (searchInput) {
      // Debounce per ridurre le chiamate durante la digitazione rapida
      let debounceTimer;
      searchInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const query = this.value.trim().toLowerCase();
          search(query);
          updateMetadata(query);
        }, 300);
      });

      // Gestione della query iniziale dall'URL
      const urlParams = new URLSearchParams(window.location.search);
      const initialQuery = urlParams.get('q');
      if (initialQuery) {
        searchInput.value = initialQuery;
        search(initialQuery);
        updateMetadata(initialQuery);
      }
    } else {
      console.error('Campo di input per la ricerca non trovato');
    }
  });
});
