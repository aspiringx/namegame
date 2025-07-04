import GlobalTemplate from './templates/GlobalTemplate';
import './Main.css';

export const MainPage = () => {
  return (
    <GlobalTemplate>
      <div style={{ margin: '0 auto', maxWidth: '600px', padding: '2rem', textAlign: 'left' }}>
        <h2 className="welcome-title" style={{ marginBottom: 0, marginTop: 0 }}>Welcome to NameGame!</h2>
        <p className="welcome-subtitle" style={{ fontSize: '.8rem', marginBottom: '2rem', marginTop: '8px' }}>The relationship game that starts with a name.</p>
        <p>We’ve all felt the social awkwardness of not remembering someone’s name, especially when we should know it!</p> 
        <p><strong>NameGame</strong> is the fun, easy way for people in face-to-face groups to meet, remember names, and get acquainted.</p>
        <h3>How to Play</h3>
        <ol>
          <li>Create a group</li>
          <li>Add your name and pic</li>
          <li>Greet people with a code</li>
        </ol>
        <p>When you do, they can instantly:
          <ul>
            <li>See your name and pic</li>
            <li>Chat with you (in game)</li>
            <li>Learn more about your group</li>
          </ul>
        </p>
        <p>
          <strong>Magic happens as more people in your group meet and remember
             each other’s names!</strong>
        </p> 

        {/* <div style={{ textAlign: "center", margin: "2rem" }}>
          <button className="button button-filled" disabled={true}>Create a Group<br /><small>(coming, more below)</small></button>
        </div> */}

        <br />
        <hr />
        <br />
        <h3 style={{ marginTop: "0" }}>Interested?</h3>
        <div style={{ color: 'gray', fontSize: 'small', marginBottom: '2rem' }}>
            Hey, this is Joe, maker of NameGame. This all started when I went to a 
            new church and found it hard to remember so many new names and faces. 
            <br /><br />
            I'm a crazy extrovert that loves meeting new people, but even I got 
            tired of months of people greeting me by name and not being sure if I 
            remembered theirs. There are still people I recognize but don't know 
            their names. Instead of talking to them, I often just wave and smile.
            After nearly two years, I'm <i>supposed to</i>&nbsp; 
            know their names :(, but haven't had a good way to do it. 
            <br /><br />
            NameGame is what I wanted and still want, inspired by my mom's 
            "getting to know you" jar of folded papers with questions to help 
            people know each other better. She was all about personal
            relationships and spending time with people she cared about.
            <br /><br />
            I didn't want Facebook or Instagram because too many of us are sick of 
            those and don't "play" there anymore. Hundreds of people you haven't
            seen in years. Thousands of mostly-irrelevant messages peppered with 
            ads.  
            <br /><br />
            I wanted NameGame to be focused on in-person relationships today, 
            not an app that gives the illusion of connection without the substance.
            One that makes developing <i>real</i> relationships easier.
            <br /><br />
            I'm married to an introvert and have a daughter on the 
            spectrum who tends to avoid new social situations... <i>unless 
            conditions are right for her to feel safe and comfortable</i>. 
            NameGame was made with a lot of feedback from them. 
            <br /><br />
            I haven't started thinking about "money stuff". Right now it's just a 
            passion project. I'd like any group to be able to easily afford it and 
            start using it in minutes without technical or financial barriers.
            <br /><br />
            It'll also be open source and free for any group that has a geek and 
            wants to self-host it so they can be <i>Super-Duper-Sure&trade;</i>&nbsp; 
            that nobody's messing with their data. 
            <br /><br />
            I hope a lot of community-minded people will want to contribute and 
            make it better. I hope <a href="https://github.com/aspiringx/.github" target="_blank">aspiring devs</a>&nbsp;
            can use it to learn how to make cool software and land great jobs.
            <br /><br />
            My church is piloting this for a few months to iron out kinks. I 
            plan to use it with neighbors too. 
            If you're interested in being part of the pilot, connect with me on&nbsp;
            <a href="https://www.linkedin.com/in/jtippetts/" target="_blank">LinkedIn</a>&nbsp;
            and mention NameGame.
        </div>
      </div>
    </GlobalTemplate>
  );
};