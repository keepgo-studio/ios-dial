export const IPHONE_PPI_WIDTH = 270.719

export const MAX_FONT_SIZE = 80

/**
 * @param {string} err 
 * @returns {string} html
 */
export const errorHTML = (err: string): string => `
  <div style="
    background-color: #000;
    text-align: center;
    color: #fff; 
    font-weight: 100; 
    padding: 2rem;
    ">
    <h1 style="
      display:inline-block;
      max-width: 400px;
      line-height: 1.6em;
      letter-spacing: -0.03em;
      ">
      <b>Oops!😢</b> you insert some attributes incorrectly
    </h1>
    <p style='color:red'>${err}</p>
  </div>
`;