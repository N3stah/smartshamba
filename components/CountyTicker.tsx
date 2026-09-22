const counties = [
  "Baringo", "Bomet", "Elgeyo-Marakwet", "Kajiado", "Kericho", "Laikipia",
  "Nakuru", "Nandi", "Narok", "Samburu", "Trans-Nzoia", "Turkana", "Uasin Gishu",
  "West Pokot", "Bungoma", "Busia", "Kakamega", "Vihiga", "Kisumu", "Siaya",
  "Homa Bay", "Migori", "Kisii", "Nyamira"
];

export default function CountyTicker() {
  const items = [...counties, ...counties];
  return (
    <div className="bg-gray-50 border-y border-gray-200 overflow-hidden py-3 relative z-20">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((county, i) => (
          <span key={i} className="text-sm font-medium flex items-center text-gray-500">
            <span className="mx-6">{county}</span>
            <span className="text-gray-300">&bull;</span>
          </span>
        ))}
      </div>
    </div>
  );
}
