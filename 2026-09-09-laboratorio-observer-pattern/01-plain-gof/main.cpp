/**
    Project     : Observer Example

    Authors     : Erich Gamma, Richard Helm, Ralph Johnson and John Vlissides

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
class Subject;
class Observer
{
    public:
        virtual ~Observer(){};
        virtual void Update(Subject* theChangedSubject) = 0;
    protected:
        Observer(){};
};
/*****************************************************************************************/

/*********************************SUBJECT ABSTRACT CLASS**********************************/
/**Similarly, an abstract class defines the Subject interface:**/
class Subject
{
    public:
        virtual ~Subject(){}
        virtual void Attach(Observer*);
        virtual void Detach(Observer*);
        virtual void Notify();
    protected:
        Subject(){};
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

    for (it =  _observers.begin() ; it !=  _observers.end(); ++it)
    {
       (*it)->Update(this);
    }
}
/*****************************************************************************************/

/*********************************CONCRET CLOCK TIMER************************************/
/**
ClockTimer is a concrete subject for storing and maintaining the time of day. It notifies
its observers every second. ClockTimer provides the interface for retrieving individual time
units such as the hour, minute, and second.
**/
class ClockTimer : public Subject
{
    public:
        ClockTimer();
        ~ClockTimer(){}
        virtual int GetHour();
        virtual int GetMinute();
        virtual int GetSecond();
        void Tick();
    private:
        int m_hours;
        int m_minutes;
        int m_seconds;
};

ClockTimer::ClockTimer()
{
        m_hours = 0;
        m_minutes = 0;
        m_seconds = 0;
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
    Notify();
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
/**Now we can define a class DigitalClock that displays the time. It inherits its graphical functionality from a
Widget class provided by a user interface toolkit. The Observer interface is mixed into the DigitalClock
interface by inheriting from Observer.**/
class DigitalClock: public Widget, public Observer
{
    public:
        DigitalClock(ClockTimer* s);
        virtual ~DigitalClock();
        virtual void Update(Subject*);
        // overrides Observer operation
        virtual void Draw();
        // overrides Widget operation;
        // defines how to draw the digital clock

    private:
        ClockTimer* _subject;
};

DigitalClock::DigitalClock(ClockTimer* s)
{
    _subject = s;
    _subject->Attach(this);
}

DigitalClock::~DigitalClock ()
{
    _subject->Detach(this);
}

void DigitalClock::Update (Subject* theChangedSubject)
{
    if (theChangedSubject == _subject)
    {
        Draw();
    }
}

void DigitalClock::Draw ()
{
    // get the new values from the subject
    string hours = TO_STRING(_subject->GetHour());
    string minutes = TO_STRING(_subject->GetMinute());
    string seconds = TO_STRING(_subject->GetSecond());

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
        virtual void Update(Subject*);

        // overrides Widget operation;
        // defines how to draw the digital clock
        virtual void Draw();

    private:
        ClockTimer* _subject;
};

AnalogClock::AnalogClock (ClockTimer* s)
{
    _subject = s;
    _subject->Attach(this);
}

AnalogClock::~AnalogClock ()
{
    _subject->Detach(this);
}

void AnalogClock::Update (Subject* theChangedSubject)
{
    if (theChangedSubject == _subject)
    {
        Draw();
    }
}

void AnalogClock::Draw ()
{
    // get the new values from the subject
    string hours = TO_STRING(_subject->GetHour());
    string minutes = TO_STRING(_subject->GetMinute());
    string seconds = TO_STRING(_subject->GetSecond());

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
    ClockTimer* timer = new ClockTimer;
    new AnalogClock(timer);
    new DigitalClock(timer);

    timer->Tick();
    timer->Tick();
    timer->Tick();
    timer->Tick();
    timer->Tick();
    timer->Tick();

    return 0;
}

/********************************************************************************************/
