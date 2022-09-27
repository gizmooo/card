/* eslint-disable */
import './CardBox.css';
import React, {useEffect, useState} from 'react';
import {CardBoxInstance} from './CardBoxInstance';


export const CardBox = () => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvas) return;
    const instance = new CardBoxInstance(canvas);

    return () => {
      instance.destroy();
    }
  }, [canvas]);

  return <canvas className='card-box' ref={setCanvas}/>
}