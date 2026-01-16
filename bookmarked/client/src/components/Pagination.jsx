import "../style/Search.css"; 

const Pagination = ({ page, lastPage, setPage }) => {
  // hide the component if there is only one page of results
  if (lastPage <= 1) return null;

  const buttons = [];
  
  // Pagination Logic
  // helper function to render a standard page number button
  const createButton = (pageNumber) => (
    <button 
      key={pageNumber} 
      onClick={() => setPage(pageNumber)} 
      className={pageNumber === page ? "active" : ""}
    >
      {pageNumber}
    </button>
  );

  // Prev Button
  // decreases current page count by one
  buttons.push(
    <button
      key="prev" 
      onClick={() => setPage(page - 1)} 
      disabled={page === 1}
      className="page-navigation-button"
    >
      Previous
    </button>
  );

  // set up the range of visible page numbers including the first and last
  const pagesToShow = new Set();
  pagesToShow.add(1); 
  if (page > 1) pagesToShow.add(page - 1);
  pagesToShow.add(page); 
  if (page < lastPage) pagesToShow.add(page + 1);
  if (lastPage > 1) pagesToShow.add(lastPage); 

  const sortedPages = [...pagesToShow].sort((a, b) => a - b);
  let prevPage = 0;

  // loop through the sorted page set and insert ellipsis where gaps exist
  sortedPages.forEach(pageNumber => {
    if (pageNumber > prevPage + 1 && prevPage !== 0) {
      buttons.push(<span key={`ell-${pageNumber}`} className="ellipsis">…</span>);
    }
    buttons.push(createButton(pageNumber));
    prevPage = pageNumber;
  });

  // Next Button
  // increases current page count by one
  buttons.push(
    <button 
      key="next" 
      onClick={() => setPage(page + 1)} 
      disabled={page === lastPage}
      className="page-navigation-button"
    >
      Next
    </button>
  );
  
  return <div className="pagination">{buttons}</div>;
};

export default Pagination;