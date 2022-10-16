import React from 'react';
import './App.css';
import {CardBox} from '../CardBox/CardBox';

const cards = ['./card-0.jpg', './card-1.jpg', './card-0.jpg', './card-1.jpg'];

function App() {
  const cover = cards[Math.floor(cards.length * Math.random())];

  return (
    <div className="App">
      <CardBox onComplete={() => console.log('Можно показывать карточку в 2D и кнопки')}
               onLoad={() => console.log('load')}
               cover={cover}/>
    </div>
  );
}

export default App;
