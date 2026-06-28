// Shared Page Header: Tiêu đề + nút hành động cho các trang admin
const PageHeader = ({ title, subtitle, action }) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500 font-medium">{subtitle}</p>}
    </div>
    {action && <div className="flex items-center gap-2">{action}</div>}
  </div>
);

export default PageHeader;
