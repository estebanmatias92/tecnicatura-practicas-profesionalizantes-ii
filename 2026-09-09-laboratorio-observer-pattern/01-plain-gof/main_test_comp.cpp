/**
 Project : Observer Example
 Authors : Erich Gamma, Richard Helm, Ralph Johnson and John
Vlissides
 Implementer : Gabriel Nicolás González Ferreira
**/
#include <sstream>
#define TO_STRING( x ) dynamic_cast< std::ostringstream & >( \
 ( std::ostringstream() << std::dec << x ) ).str()
#include <iostream>
#include <list>
#include <string>
using namespace std;

/**********************************OBSERVER INTERFACE************************************/
/**An abstract class defines the Observer interface:**/
class Observer
{
    public:
        virtual ~Observer(){};
        virtual void Update() = 0;
        Observer(){};
};


/*****************************************************************************************/
/*********************************SUBJECT ABSTRACT CLASS**********************************/
/**Similarly, an abstract class defines the Subject interface:**/

class Subject
{
    public:
        Subject(){};
        virtual ~Subject(){}
        virtual void Attach(Observer*);
        virtual void Detach(Observer*);
        virtual void Notify();

    private:
        list<Observer*> _observers;
};

void Subject::Attach (Observer* o)
{
    _observers.push_front(o);
}
void Subject::Detach (Observer* o)
{
    _observers.remove(o);
}
void Subject::Notify ()
{
    list<Observer*>::iterator it;
    for (it = _observers.begin() ; it != _observers.end(); ++it)
    {
        (*it)->Update();
    }
}

/*****************************************************************************************/
/*********************************CONCRET CLOCK TIMER************************************/

/**
ClockTimer is a concrete subject for storing and maintaining the time of day. It notifies
its observers every second. ClockTimer provides the interface for retrieving individual time
units such as the hour, minute, and second.
**/

class ClockTimer
{
    public:
        ClockTimer(Subject* subject);
        ~ClockTimer();
        virtual int GetHour();
        virtual int GetMinute();
        virtual int GetSecond();
        virtual Subject* getSubject();
        void Tick();
    private:
        int m_hours;
        int m_minutes;
        int m_seconds;
        Subject* m_subject;
};

ClockTimer::ClockTimer(Subject* subject)
{
    m_hours = 0;
    m_minutes = 0;
    m_seconds = 0;
    m_subject = subject;
}

ClockTimer::~ClockTimer()
{
    cout << "Se destruye el Subject" << endl;
    delete m_subject;
}

int ClockTimer::GetHour( void )
{
    return this->m_hours;
}

int ClockTimer::GetMinute( void )
{
    return this->m_minutes;
}

int ClockTimer::GetSecond( void )
{
    return this->m_seconds;
}

Subject* ClockTimer::getSubject() 
{
 return m_subject;
}

void ClockTimer::Tick ()
{
 // No update internal time-keeping state, only a demo.
 // ...
     m_seconds++;
    if(m_seconds == 60)
    {
        m_seconds = 0;
        m_minutes++;
    if(m_minutes == 60)
    {
        m_seconds = 0;
        m_minutes = 0;
        m_hours++;
    if(m_hours == 24)
    {
        m_seconds = 0;
        m_minutes = 0;
        m_hours = 0;
    }
 }
 }
m_subject->Notify();
}
/*************************************************************************************************/
/****************************************WIDGET INTERFACE********************************/
class Widget
{
    public:
        virtual ~Widget() {}
        virtual void Draw() = 0;
};

/****************************************CONCRETE DIGITAL CLOCK********************************/
/**Now we can define a class DigitalClock that displays the time. It inherits its graphical functionality from 
 * a Widget class provided by a user interface toolkit. The Observer interface is mixed into the DigitalClock
interface by inheriting from Observer.**/

class DigitalClock: public Widget, public Observer
{
    public:
        DigitalClock(ClockTimer* s);
        virtual ~DigitalClock();
        virtual void Update();
        // overrides Observer operation
        virtual void Draw();
        // overrides Widget operation;
        // defines how to draw the digital clock
    private:
        ClockTimer* m_subject;
};

DigitalClock::DigitalClock(ClockTimer* s)
{
    m_subject = s;
    m_subject->getSubject()->Attach(this);
}

DigitalClock::~DigitalClock ()
{
    m_subject->getSubject()->Detach(this);
}

void DigitalClock::Update()
{
    Draw();  
}

void DigitalClock::Draw ()
{
    // get the new values from the subject
    string hours = TO_STRING(m_subject->GetHour());
    string minutes = TO_STRING(m_subject->GetMinute());
    string seconds = TO_STRING(m_subject->GetSecond());
    // draw the digital clock
    if(hours.size() == 1){hours = "0"+hours;}
    if(minutes.size() == 1){minutes = "0"+minutes;}
    if(seconds.size() == 1){seconds = "0"+seconds;}
    cout <<"I am Digital: "<< hours<<":"<<minutes<<":"<<seconds<<endl;
}
/*************************************************************************************************/
/****************************************CONCRETE ANALOG CLOCK***********************************/
/**An AnalogClock class can be defined in the same way.**/

class AnalogClock: public Widget, public Observer
{
    public:
        AnalogClock(ClockTimer*);
        virtual ~AnalogClock();
        // overrides Observer operation
        virtual void Update();
        // overrides Widget operation;
        // defines how to draw the digital clock
        virtual void Draw();
    private:
        ClockTimer* m_subject;
};

AnalogClock::AnalogClock (ClockTimer* s)
{
    m_subject = s;
    m_subject->getSubject()->Attach(this);
}

AnalogClock::~AnalogClock ()
{
    m_subject->getSubject()->Detach(this);
}

void AnalogClock::Update ()
{
        Draw();
}

void AnalogClock::Draw ()
{
 // get the new values from the subject
    string hours = TO_STRING(m_subject->GetHour());
    string minutes = TO_STRING(m_subject->GetMinute());
    string seconds = TO_STRING(m_subject->GetSecond());
    if(hours.size() == 1){hours = "0"+hours;}
    if(minutes.size() == 1){minutes = "0"+minutes;}
    if(seconds.size() == 1){seconds = "0"+seconds;}
    // draw the digital clock
    cout <<"I am Analog: "<< hours<<":"<<minutes<<":"<<seconds<<endl;
}
/*************************************************************************************************/
/**MAIN**/

int main()
{
    ClockTimer* timer = new ClockTimer(new Subject());
    AnalogClock* ac= new AnalogClock(timer);
    DigitalClock* dc = new DigitalClock(timer);

    timer->Tick();
    timer->Tick();
    timer->Tick();
    timer->Tick();
    timer->Tick();
    timer->Tick();

    delete ac;
    delete dc;
    delete timer;
    return 0;
}