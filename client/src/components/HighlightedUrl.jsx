// Renders a URL with every matched pattern span wrapped in <mark>.
// Builds a boolean "covered" mask from match [index, index+len) ranges so
// overlapping matches merge cleanly into single highlights.
export default function HighlightedUrl({ url, matches }) {
  if (!url) return null;

  const covered = new Array(url.length).fill(false);
  for (const m of matches) {
    for (let i = m.index; i < m.index + m.pattern.length && i < url.length; i++) {
      covered[i] = true;
    }
  }

  const parts = [];
  let buffer = '';
  let bufferHighlighted = covered[0] || false;

  const flush = (highlighted, key) => {
    if (buffer === '') return;
    parts.push(highlighted ? <mark key={key}>{buffer}</mark> : <span key={key}>{buffer}</span>);
    buffer = '';
  };

  for (let i = 0; i < url.length; i++) {
    if (covered[i] !== bufferHighlighted) {
      flush(bufferHighlighted, i);
      bufferHighlighted = covered[i];
    }
    buffer += url[i];
  }
  flush(bufferHighlighted, 'last');

  return <div className="url-highlight">{parts}</div>;
}
