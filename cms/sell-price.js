// Price field: a plain number for fixed prices, a live breakdown for calculated ones.
import { calculateFormulaPrice, inferMetalRateKey, parseWeightGrams } from '/admin/metal-pricing.js';

const { CMS, createClass, h } = window;
const ratesRequest = fetch('/admin/rates.json').then(r => (r.ok ? r.json() : null)).catch(() => null);
const npr = n => 'NPR ' + Math.round(n).toLocaleString('en-IN');
const INPUTS = [
  'priceMode', 'material', 'metalRateKey', 'weight', 'pricingWeightGrams', 'wastagePercent',
  'makingCharge', 'makingChargeType', 'stoneCost', 'priceRoundingIncrement',
];

const Control = createClass({
  getInitialState() { return { rates: undefined }; },
  componentDidMount() {
    this.alive = true;
    this.last = this.inputs();
    ratesRequest.then(data => this.alive && this.setState({ rates: data }));
  },
  componentWillUnmount() { this.alive = false; },
  // Decap only re-renders a field when its own value changes; this one depends on the others.
  shouldComponentUpdate() { return true; },
  get(name) { return this.props.entry.getIn(['data', name]); },
  isFormula() { return this.get('priceMode') === 'formula'; },
  inputs() { return INPUTS.map(name => this.get(name)).join('|'); },
  calculate() {
    const key = this.get('metalRateKey') || inferMetalRateKey(this.get('material'));
    const rate = this.state.rates && this.state.rates.rates.find(r => r.rateKey === key && r.isActive);
    const weight = Number(this.get('pricingWeightGrams')) || parseWeightGrams(this.get('weight'));
    const result = calculateFormulaPrice({
      ratePerGram: rate && rate.pricePerGram,
      weightGrams: weight,
      wastagePercent: this.get('wastagePercent'),
      makingCharge: this.get('makingCharge'),
      makingChargeType: this.get('makingChargeType'),
      stoneCost: this.get('stoneCost'),
      roundingIncrement: this.get('priceRoundingIncrement'),
    });
    return { key, rate, weight, result };
  },
  componentDidUpdate() {
    // Wait for the rate, so an edit made while it loads is still priced.
    if (this.isFormula() && this.state.rates === undefined) return;
    // Only after an edit, so just opening a product never creates unsaved changes.
    const inputs = this.inputs();
    if (inputs === this.last) return;
    this.last = inputs;
    if (!this.isFormula()) return;
    const { result } = this.calculate();
    // The saved price is the fallback if the website has no rate.
    if (result && result.price !== this.props.value) this.props.onChange(result.price);
  },
  isValid() {
    return Number(this.props.value) >= 500 || { error: { message: 'Sell price must be at least NPR 500.' } };
  },
  render() {
    const input = h('input', {
      id: this.props.forID,
      className: this.props.classNameWrapper,
      type: 'number',
      min: 500,
      value: this.props.value == null ? '' : this.props.value,
      onChange: e => this.props.onChange(e.target.value === '' ? null : Math.round(Number(e.target.value))),
    });
    if (!this.isFormula()) return input;

    const box = { border: '2px solid #dfdfe3', borderRadius: 5, padding: '14px 18px', background: '#f5f8f5', fontSize: 14, lineHeight: 1.8 };
    const line = { display: 'flex', justifyContent: 'space-between' };
    if (this.state.rates === undefined) return h('div', { style: box }, "Loading today's rate...");

    const { key, rate, weight, result } = this.calculate();
    if (!result) {
      const problem = !this.state.rates ? "Today's rate could not be loaded. Check your internet, or type a price."
        : !key ? 'This material has no daily rate. Choose one under "More: Use Another Metal Rate", or use Fixed price.'
          : !rate ? 'This metal has no rate today. Update it in the admin dashboard, or type a price.'
            : 'Enter the weight to see the price.';
      return h('div', null, h('div', { style: { ...box, marginBottom: 8 } }, problem), input);
    }

    const row = (label, value) => h('div', { style: line }, h('span', null, label), h('span', null, npr(value)));
    return h('div', { style: box, id: this.props.forID },
      row(`Metal: ${weight}g x ${rate.pricePerGram}`, result.metal),
      row(`Wastage ${this.get('wastagePercent') || 0}%`, result.wastage),
      row('Making charge', result.making),
      row('Stones', result.stones),
      h('div', { style: { ...line, borderTop: '1px solid #bbb', marginTop: 6, paddingTop: 6, fontWeight: 700, fontSize: 18 } },
        h('span', null, 'Sell price today'), h('span', { 'data-sell-price': result.price }, npr(result.price))),
      h('small', null, `${rate.sourceLabel}. The website price follows the daily rate.`));
  },
});

CMS.registerWidget('sell-price', Control, ({ value }) => h('span', null, value));
