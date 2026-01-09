export default function Sparkles() {
    const sparkles = new Array(20).fill(0);

    return (
        <div className="sparkle-container w-full h-full">
            {sparkles.map((_, i) => {
                const size = Math.random() * 8 + 10;
                const left = Math.random() * 100;
                const bottom = Math.random() * -20;
                const duration = Math.random() * 8 + 8;
                const delay = Math.random() * -15;

                return (
                    <div
                        key={i}
                        className="sparkle"
                        style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            left: `${left}%`,
                            bottom: `${bottom}vh`,
                            animationDuration: `${duration}s`,
                            animationDelay: `${delay}s`,
                        }}
                    />
                );
            })}
        </div>
    );
}
