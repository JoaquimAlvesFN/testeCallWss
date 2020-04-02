import React, { useState, useEffect } from 'react';
import JsSIP from 'jssip';

export default function Call() {
  const [destino, setDestino] = useState('');
  const [atendido, setAtendido] = useState(false);
  const [phone, setPhone] = useState({});
  const [reg, setReg] = useState(false);
  const [rtcsession, setRtcsession] = useState({});
  const [mudo, setMudo] = useState(false);

  function valor(e) {
     setDestino(e.target.value);
  }


  function call() {

    if(destino == ''){
      alert('Digite um numero válido!');
      return;
    }
    
      let remoteAudio = new window.Audio();
      remoteAudio.autoplay = true;

      let eventHandlers = {
        'progress': (e) => {
          console.log('call is in progress');
        },
        'failed': (e) => {
          console.log('call failed with cause: '+ e);
        },
        'confirmed': (e) => {
          setAtendido(true);
          setDestino('');
        },
        'ended': (e) => {
          setAtendido(false);
        }
      };

        let session = phone.call(`sip:${destino}@192.168.0.107`, {
          'eventHandlers': eventHandlers,
          'extraHeaders': [ 'X-Foo: foo', 'X-Bar: bar' ],
          'mediaConstraints': {'audio': true, 'video': false},
        });
  
        function add_stream() {
          session.connection.addEventListener('addstream', (e) => {
            remoteAudio.srcObject = (e.stream);
          });
        }
        
        add_stream();     

  }

  function hangup() {
    rtcsession.session.terminate();
    setAtendido(false);
  }

  function answer() {

    let localAudio = new window.Audio();
    localAudio.autoplay = true;

    rtcsession.session.answer({
      mediaConstraints: {
        audio: true,
        video: false
      }
    });

    function add_stream() {
      rtcsession.session.connection.addEventListener('addstream', (e) => {
        localAudio.srcObject = (e.stream);
      });
    }
    
    add_stream();  
    setAtendido(true);
    
  }

  function mute() {
    rtcsession.session.mute();
    setMudo(true);
  }

  function unmute() {
    rtcsession.session.unmute();
    setMudo(false);
  }

  function transfer() {
    let extraHeaders = [ 'X-Foo: foo', 'X-Bar: bar' ];

    let options = {
      'duration': 160,
      'interToneGap': 1200,
      'extraHeaders': extraHeaders
    };

    rtcsession.session.refer(`sip:${destino}@192.168.0.107`, options);

  }

  useEffect(() => {
    let socket1 = new JsSIP.WebSocketInterface('wss://192.168.0.107:8089/ws');

      let ua = new JsSIP.UA({
        sockets: [
          {socket: socket1, weight: 10}
        ],
        uri: 'sip:6002@192.168.0.107:5061',
        authorization_user: '6002',
        password: '6002@2020',
        register: true
      });

      ua.start();

      ua.on('registered', () => {
        setReg(true);
        setPhone(ua);
      });

      ua.on('unregistered', () => {
        setReg(false);
      });

      ua.on('newRTCSession', (e) => {
        setRtcsession(e);
      });

  }, []);

  return (
    <div>
      {
        reg ? <span><b>Registrado no Asterisk</b></span> : <span>Não Registrado no Asterisk</span>
      }
      <br/>
      <input placeholder="Inserir um ramal/telefone" value={destino} onChange={(text) => {valor(text)}} />
      <br/>
      {
         atendido 
          ? 
            <div>
              <button onClick={hangup}>Desligar</button> &nbsp;
              <button onClick={() => {
                if(mudo){
                  unmute();
                }else{
                  mute();
                }
              }}>
                {
                  mudo ? 'Audio' : 'Mudo'
                }
              </button> &nbsp;
              <button onClick={transfer}>Transferir</button> &nbsp;
            </div>
          : 
            rtcsession.originator == 'remote' 
	          ?
	            <button onClick={answer}>Atender</button>
	          :
	            <button onClick={call}>Ligar</button>
      }
      
    </div>
  );
}
