import './test.css';

import React from 'react';

type Props = {
  active?: boolean;
  num?: number;
}

const card = [require('./card.png'), require('./card_1.png'), require('./card.png'), require('./card_1.png')];

export const TestScreen = ({active, num = 0}: Props) => {
  return <div className={active ? 'test active' : 'test'}>
    <div className="inner">
      <img src={card[num]} alt=""/>
      <div className='title'>НАПАДАЮЩИЙ</div>
      <button className='button'>В коллекцию</button>
    </div>
  </div>
}