import { Link } from 'react-router-dom';
import SmoothImage from './SmoothImage';

interface CategoryTileProps {
  id: string;
  name: string;
  image: string;
  priority?: boolean;
}

export default function CategoryTile({ id, name, image, priority = false }: CategoryTileProps) {
  const isVideo = (url: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

  return (
    <Link to={`/products?category=${id}`} aria-label={name} className="group relative block w-full aspect-[3/4] overflow-hidden rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
      {isVideo(image) ? (
        <video 
          src={image} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : priority ? (
        <img 
          src={image} 
          alt={name} 
          width={400}
          height={533}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 320px, 400px"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <SmoothImage 
          src={image} 
          alt={name} 
          width={400}
          height={533}
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 320px, 400px"
          decoding="async"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      )}
      {/* Dark overlay & subtle gradient to ensure text stands out clearly in both light & dark mode */}
      {/* <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/45 transition-colors duration-300 group-hover:from-black/80 group-hover:via-black/45 group-hover:to-black/55" /> */}
      <div>className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/33 to-black/42 group-hover:from-black/75 group-hover:via-black/43 group-hover:to-black/52 transition-colors duration-300"</div>
      <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
        <h2 className="text-white text-heading-lg font-sans tracking-heading-lg font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-300">
          {name}
        </h2>
      </div>
    </Link>
  );
}
