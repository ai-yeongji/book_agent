const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('kyobo-page.html', 'utf-8');
const $ = cheerio.load(html);

// Look for list items
const listItems = $('li');
console.log(`Total <li> elements: ${listItems.length}`);

// Find list items that contain book titles
let bookCount = 0;
listItems.each((i, elem) => {
  const $li = $(elem);
  const titleLink = $li.find('.prod_link').filter((_, el) => {
    const text = $(el).text().trim();
    return text.length > 3 && !text.includes('새창보기');
  }).first();

  if (titleLink.length > 0 && bookCount < 10) {
    bookCount++;
    console.log(`\n=== Book ${bookCount} ===`);
    console.log('LI classes:', $li.attr('class') || 'none');

    const title = titleLink.text().trim();
    console.log('Title:', title);

    // Find author - look for text after the title
    const authorText = $li.find('[class*="fz-14"]').filter((_, el) => {
      const text = $(el).text();
      return text.includes('지은이') || text.includes('저') || text.includes('지음');
    }).first().text().trim();
    console.log('Author raw:', authorText || 'not found');

    // Find image - look for images in the link
    const imgs = $li.find('img');
    let coverImg = null;
    imgs.each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src') || '';
      if (src.includes('pdt') || src.includes('cover') || src.includes('.jpg')) {
        coverImg = src;
        return false; // break
      }
    });
    console.log('Image src:', coverImg || 'not found');

    // Debug: show all text content
    if (bookCount === 1) {
      console.log('\n--- First book full text (first 300 chars) ---');
      console.log($li.text().replace(/\s+/g, ' ').substring(0, 300));
    }

    // Get href
    const href = titleLink.attr('href');
    console.log('Link:', href || 'not found');
  }
});

console.log(`\n\nTotal books found: ${bookCount}`);

// Try to identify the list container
if (bookCount > 0) {
  const firstBookLi = listItems.filter((i, elem) => {
    const $li = $(elem);
    return $li.find('.prod_link').filter((_, el) => {
      const text = $(el).text().trim();
      return text.length > 3 && !text.includes('새창보기');
    }).length > 0;
  }).first();

  if (firstBookLi.length > 0) {
    const ul = firstBookLi.parent();
    console.log('\nList container:');
    console.log('Tag:', ul.prop('tagName'));
    console.log('Classes:', ul.attr('class') || 'none');
  }
}
