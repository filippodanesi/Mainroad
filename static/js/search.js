let lunrIndex, lunrResult, pagesIndex;
const siteName = 'SERPsecrets'; // Sostituisci con il nome effettivo del tuo sito

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
          pagesIndex.forEach(page => {
            this.add(page);
          });
        });
        resolve();
      })
      .catch(e => {
        console.error('Error fetching index:', e);
        document.body.innerHTML += '<p style="color: red;">Error loading search data</p>';
      });
  });
}

function search(query) {
  if (!query) {
    displayResults([]);
    updateMetadata('');
    return;
  }
  try {
    lunrResult = lunrIndex.search(query);
    displayResults(lunrResult);
    updateMetadata(query);
  } catch (e) {
    console.error('Error during search:', e);
    displayResults([]);
  }
}

function displayResults(results) {
  const searchResults = document.getElementById('main-search-results');
  if (!searchResults) {
    console.error('main-search-results element not found');
    return;
  }

  if (!results.length) {
    searchResults.innerHTML = '<p>No results found</p>';
    return;
  }

  let resultsHtml = '';
  results.forEach((result, index) => {
    const doc = pagesIndex.find(page => page.id === result.ref);
    if(doc) {
      resultsHtml += `
        <div>
          <h2>${index + 1}. <a href="${doc.url}">${doc.title}</a></h2>
          <p>${doc.content.substring(0, 150)}...</p>
        </div>
      `;
    } else {
      resultsHtml += `<p style="color: red;">Error: Document not found for ref: ${result.ref}</p>`;
    }
  });

  searchResults.innerHTML = resultsHtml || '<p>No results could be displayed.</p>';
}

function updateMetadata(query) {
  document.title = query
    ? `You searched for: ${query} — ${siteName}`
    : `Search Results — ${siteName}`;

  let metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', query
      ? `Here are all the contents of ${siteName} that match the '${query}' term.`
      : 'Search content on our site.');
  }

  let newUrl = query
    ? `/search-results/?q=${encodeURIComponent(query)}`
    : '/search-results/';
  history.pushState({}, '', newUrl);
}

document.addEventListener('DOMContentLoaded', function() {
  initLunr().then(() => {
    const searchInput = document.getElementById('search-field-results');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        search(this.value);
      });

      const urlParams = new URLSearchParams(window.location.search);
      const initialQuery = urlParams.get('q');
      if (initialQuery) {
        searchInput.value = initialQuery;
        search(initialQuery);
      }
    } else {
      console.error('Search input not found');
    }
  });
});
