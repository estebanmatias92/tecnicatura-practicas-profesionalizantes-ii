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
};

/*****************************************************************************************/
/*********************************SUBJECT ABSTRACT CLASS**********************************/
/**Similarly, an abstract class defines the Subject interface:**/
class Subject
{
    public:
        Subject(){};
        virtual ~Subject(){}
        void Attach (Observer* o)
        {
            m_observers.push_front(o);
        }
        void Detach (Observer* o)
        {
            m_observers.remove(o);
        }
        void Notify ()
        {
            list<Observer*>::iterator it;
            for (it = m_observers.begin() ; it != m_observers.end(); ++it)
            {
                (*it)->Update();
            }
        }

    private:
        list<Observer*> m_observers;
};
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
        ClockTimer()
        {
            m_hours = 0;
            m_minutes = 0;
            m_seconds = 0;
            m_subject = new Subject();
        }

        ~ClockTimer()
        {
            cout << "Destroy Subject!" << endl;
            delete m_subject;
        }

        int GetHour( void )
        {
            return this->m_hours;
        }

        int GetMinute( void )
        {
            return this->m_minutes;
        }

        int GetSecond( void )
        {
            return this->m_seconds;
        }

        Subject* getSubject() 
        {
            return m_subject;
        }

        void Tick ()
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

    private:
        int m_hours;
        int m_minutes;
        int m_seconds;
        Subject* m_subject;
};


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
        DigitalClock(ClockTimer* s)
        {
            m_timer = s;
            m_timer->getSubject()->Attach(this);
        }

        ~DigitalClock ()
        {
            m_timer->getSubject()->Detach(this);
        }

        void Update()
        {
            Draw();  
        }

        void Draw ()
        {
            // get the new values from the subject
            string hours = TO_STRING(m_timer->GetHour());
            string minutes = TO_STRING(m_timer->GetMinute());
            string seconds = TO_STRING(m_timer->GetSecond());
            // draw the digital clock
            if(hours.size() == 1){hours = "0"+hours;}
            if(minutes.size() == 1){minutes = "0"+minutes;}
            if(seconds.size() == 1){seconds = "0"+seconds;}
            cout <<"I am Digital: "<< hours<<":"<<minutes<<":"<<seconds<<endl;
        }

    private:
        ClockTimer* m_timer;
};
/*************************************************************************************************/
/****************************************CONCRETE ANALOG CLOCK***********************************/
/**An AnalogClock class can be defined in the same way.**/

class AnalogClock: public Widget, public Observer
{
    public:
        AnalogClock (ClockTimer* s)
        {
            m_timer = s;
            m_timer->getSubject()->Attach(this);
        }

        ~AnalogClock ()
        {
            m_timer->getSubject()->Detach(this);
        }

        void Update ()
        {
                Draw();
        }

        void Draw ()
        {
         // get the new values from the subject
            string hours = TO_STRING(m_timer->GetHour());
            string minutes = TO_STRING(m_timer->GetMinute());
            string seconds = TO_STRING(m_timer->GetSecond());
            if(hours.size() == 1){hours = "0"+hours;}
            if(minutes.size() == 1){minutes = "0"+minutes;}
            if(seconds.size() == 1){seconds = "0"+seconds;}
            // draw the digital clock
            cout <<"I am Analog: "<< hours<<":"<<minutes<<":"<<seconds<<endl;
        }
    private:
        ClockTimer* m_timer;
};


/*************************************************************************************************/
/**MAIN**/

int main()
{
    ClockTimer* timer = new ClockTimer;
    AnalogClock* ac = new AnalogClock(timer);
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