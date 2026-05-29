import { Link } from "react-router";

type Props = {
  title: string;
  description?: string;
  items?: string[];
};

export function SimplePage({ title, description, items = [] }: Props) {
  return (
    <div className="min-h-screen bg-black text-white px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-10">
      <h1 className="text-3xl mb-3">{title}</h1>
      {description && <p className="text-zinc-400 mb-6 max-w-3xl">{description}</p>}
      {items.length > 0 && (
        <ul className="space-y-3 mb-8">
          {items.map((item) => (
            <li key={item} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">{item}</li>
          ))}
        </ul>
      )}
      <Link to="/" className="inline-block bg-white text-black px-5 py-2.5 rounded-xl">
        Ana səhifəyə qayıt
      </Link>
    </div>
  );
}

