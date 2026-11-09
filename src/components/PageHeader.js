import CurrencyToggle from './CurrencyToggle';

function PageHeader({ title }) {
  return (
    <div className="flex justify-between items-center mb-6">
        {/* <h2 className="text-2xl font-semibold mb-6">Wealth</h2> */}
      <h2 className="text-xl font-semibold mb-6">{title}</h2>
      <CurrencyToggle />
    </div>
  );
}

export default PageHeader;