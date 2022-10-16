/* eslint-disable */
import './CardBox.css';
import React, {useEffect, useState} from 'react';
import {EventHandler, CardBoxInstance} from './instance/CardBoxInstance';


/**
 * cover
 * изображение должно быть растровое,
 * размер 204x304 без закруглений углов
 * желательно в размере x2(для ретины)
 *
 * onStateChange
 * тут все понятно, в App.tsx описаны все состояния
 * нулевое, конечно, не стриггерит никогда
 */
export type Props = {
  cover?: string;
  onStateChange?: EventHandler;
}


export const CardBox = ({cover, onStateChange}: Props) => {
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

  useEffect(() => {
    if (instance) instance.onStateChange = onStateChange;
  }, [instance, onStateChange]);

  return <div className='card-box' ref={setCanvas}/>
}