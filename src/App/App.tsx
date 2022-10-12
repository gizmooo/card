import React from 'react';
import './App.css';
import {CardBox} from '../CardBox/CardBox';

function App() {
  return (
    <div className="App">
      <CardBox onComplete={() => console.log('complete')} onLoad={() => console.log('load')} cover={'123'}/>
    </div>
  );
}

export default App;
