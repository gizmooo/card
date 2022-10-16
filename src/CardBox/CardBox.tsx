/* eslint-disable */
import './CardBox.css';
import React, {useEffect, useState} from 'react';
import {EventHandler, CardBoxInstance} from './instance/CardBoxInstance';


export type Props = {
  // изображение должно быть растровое,
  // размер 204x304 без закруглений углов
  // желательно в размере x2(для ретины)
  cover?: string;
  onLoad?: EventHandler;
  onComplete?: EventHandler;
}

export const CardBox = ({cover, onLoad, onComplete}: Props) => {
  const [canvas, setCanvas] = useState<HTMLDivElement | null>(null);
  const [instance, setInstance] = useState<CardBoxInstance>();

  useEffect(() => {
    if (!canvas) return;
    if (!cover) throw new Error('Пацантре, ссыль на обложку карточки должна быть сразу');
    const inst = new CardBoxInstance(canvas, cover);
    setInstance(inst);

    return () => {
      inst.destroy();
    }
  }, [canvas]);

  // хендлер окончания загрузки
  useEffect(() => {
    if (instance) instance.onLoad = onLoad;
  }, [instance, onLoad]);

  // хендлер окончания анимаций
  useEffect(() => {
    if (instance) instance.onComplete = onComplete;
  }, [instance, onComplete])

  return <div className='card-box' ref={setCanvas}/>
}