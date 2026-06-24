import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  // Generate an array of 15 items to dynamically render the rings
  const layers = Array.from({ length: 15 });

  return (
    <StyledWrapper>
      <aside className="container-loader">
        {layers.map((_, index) => (
          <div 
            key={index} 
            style={{ '--s': index }} 
            className="aro" 
          />
        ))}
      </aside>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .container-loader {
    width: 300px;
    height: 300px;
    position: relative;
    transform-style: preserve-3d;
    transform: perspective(500px) rotateX(60deg);

    .aro {
      position: absolute;
      inset: calc(var(--s) * 10px);
      box-shadow: inset 0 0 80px dodgerblue;
      clip-path: polygon(
        50% 0%,
        61% 35%,
        98% 35%,
        68% 57%,
        79% 91%,
        50% 70%,
        21% 91%,
        32% 57%,
        2% 35%,
        39% 35%
      );
      animation: standalone 3s infinite ease-in-out both;
      animation-delay: calc(var(--s) * -0.1s);
    }
  }

  @keyframes standalone {
    0%,
    100% {
      transform: translateZ(-100px) scaleX(-1);
    }
    50% {
      transform: translateZ(100px) scaleX(1);
    }
  }
`;

export default Loader;