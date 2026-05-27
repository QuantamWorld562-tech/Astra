import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import "./Explore.css";

function Explore() {
  const { posts } = useSelector((s) => s.post);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const imgs = containerRef.current.querySelectorAll(".exp-img");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    imgs.forEach((img, i) => {
      // stagger: small delay per visible image
      img.style.transitionDelay = `${(i % 12) * 40}ms`;
      io.observe(img);
    });

    return () => io.disconnect();
  }, [posts]);

  return (
    <div className="explore-can">
      <div className="explore-box" ref={containerRef}>
        {posts.map((t) => {
          return (
            <div key={t._id} className="tile-large">
              <img
                src={t.image}
                alt={t.caption || "explore image"}
                className="exp-img"
                loading="lazy"
                decoding="async"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Explore;
