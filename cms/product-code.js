// Product code field: suggests the next free code, refuses taken ones, locked once saved.
const { CMS, createClass, h } = window;
const PREFIX = { rings: 'RG', necklaces: 'NS', earrings: 'ER', bracelets: 'BR', sets: 'ST' };
const FORMAT = /^[A-Z]{2}[0-9]{3,}$/;

const Control = createClass({
  getInitialState() { return { codes: null, failed: false }; },
  componentDidMount() {
    this.alive = true;
    this.load();
    // Catch a code saved meanwhile in another tab.
    window.addEventListener('focus', this.load);
  },
  componentWillUnmount() {
    this.alive = false;
    window.removeEventListener('focus', this.load);
  },
  shouldComponentUpdate() { return true; },
  load() {
    fetch('/admin/codes.json', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error('codes'))))
      .then(codes => this.alive && this.setState({ codes, failed: false }))
      .catch(() => this.alive && this.setState({ failed: true }));
  },
  isNew() { return this.props.entry.get('newRecord') === true; },
  owner(code) { return (this.state.codes || []).find(p => p.id.toUpperCase() === code); },
  nextFree() {
    const prefix = PREFIX[this.props.entry.getIn(['data', 'category'])];
    if (!prefix || !this.state.codes) return null;
    const used = this.state.codes.map(p => p.id.toUpperCase().match(new RegExp(`^${prefix}(\\d+)$`))).filter(Boolean).map(m => Number(m[1]));
    return prefix + String(Math.max(0, ...used) + 1).padStart(3, '0');
  },
  problem() {
    const code = String(this.props.value || '');
    if (!FORMAT.test(code)) return 'Use two capital letters and at least three numbers, like RG005.';
    if (!this.isNew()) return null;
    if (!this.state.codes) return this.state.failed ? 'Could not check the codes in use. Refresh the page.' : 'Still checking the codes in use. Try again.';
    const owner = this.owner(code);
    if (!owner) return null;
    const next = this.nextFree();
    return `${code} is already used by ${owner.name}.${next ? ` Use ${next}.` : ' Choose another code.'}`;
  },
  isValid() {
    const message = this.problem();
    return message ? { error: { message } } : true;
  },
  render() {
    const isNew = this.isNew();
    const next = isNew ? this.nextFree() : null;
    const problem = isNew && this.props.value ? this.problem() : null;
    return h('div', null,
      h('input', {
        id: this.props.forID,
        className: this.props.classNameWrapper,
        type: 'text',
        value: this.props.value || '',
        disabled: !isNew,
        onChange: e => this.props.onChange(e.target.value.toUpperCase().trim()),
      }),
      problem && h('div', { style: { color: '#b00020', marginTop: 6, fontSize: 14 } }, problem),
      next && next !== this.props.value && h('button', {
        type: 'button',
        style: { marginTop: 8, padding: '8px 14px', border: 0, borderRadius: 6, background: '#1f4d3a', color: '#fff', cursor: 'pointer' },
        onClick: () => this.props.onChange(next),
      }, `Use next free code: ${next}`),
      isNew && !next && h('div', { style: { marginTop: 6, fontSize: 13 } }, 'Choose a category below to get a suggested code, or type your own.'));
  },
});

CMS.registerWidget('product-code', Control);
