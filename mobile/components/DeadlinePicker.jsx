import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const DeadlinePicker = ({ currentDeadline, onSave, onCancel }) => {
  const router = useRouter();
  const { colors: COLORS } = useTheme();

  // Initialize with current deadline or now
  const [selectedDate, setSelectedDate] = useState(
    currentDeadline ? new Date(currentDeadline) : new Date()
  );
  const [selectedHour, setSelectedHour] = useState(
    currentDeadline ? new Date(currentDeadline).getHours() % 12 || 12 : 12
  );
  const [selectedMinute, setSelectedMinute] = useState(
    currentDeadline ? new Date(currentDeadline).getMinutes() : 0
  );
  const [selectedPeriod, setSelectedPeriod] = useState(
    currentDeadline && new Date(currentDeadline).getHours() >= 12 ? 'PM' : 'AM'
  );

  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Generate calendar days
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Previous month days
    const prevMonthDays = getDaysInMonth(
      currentMonth === 0 ? 11 : currentMonth - 1,
      currentMonth === 0 ? currentYear - 1 : currentYear
    );
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(
          currentMonth === 0 ? currentYear - 1 : currentYear,
          currentMonth === 0 ? 11 : currentMonth - 1,
          prevMonthDays - i
        ),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(currentYear, currentMonth, i),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(
          currentMonth === 11 ? currentYear + 1 : currentYear,
          currentMonth === 11 ? 0 : currentMonth + 1,
          i
        ),
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const canGoPrevious = () => {
    const firstDayOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const firstDayOfCurrentMonthMidnight = new Date(firstDayOfCurrentMonth);
    firstDayOfCurrentMonthMidnight.setHours(0, 0, 0, 0);
    return firstDayOfCurrentMonthMidnight > today;
  };

  const handlePreviousMonth = () => {
    if (canGoPrevious()) {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateSelect = (dateObj) => {
    const dateWithoutTime = new Date(dateObj.date);
    dateWithoutTime.setHours(0, 0, 0, 0);
    
    if (dateWithoutTime >= today) {
      setSelectedDate(dateObj.date);
      // Update month/year if selecting from adjacent months
      setCurrentMonth(dateObj.date.getMonth());
      setCurrentYear(dateObj.date.getFullYear());
    }
  };

  const isDateSelected = (dateObj) => {
    const compareDate = new Date(dateObj.date);
    compareDate.setHours(0, 0, 0, 0);
    const selectedDateCompare = new Date(selectedDate);
    selectedDateCompare.setHours(0, 0, 0, 0);
    return compareDate.getTime() === selectedDateCompare.getTime();
  };

  const isToday = (dateObj) => {
    const compareDate = new Date(dateObj.date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  };

  const isPastDate = (dateObj) => {
    const compareDate = new Date(dateObj.date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const handleSave = () => {
    // Combine date and time
    const finalDate = new Date(selectedDate);
    let hours = selectedHour;
    if (selectedPeriod === 'PM' && hours !== 12) {
      hours += 12;
    } else if (selectedPeriod === 'AM' && hours === 12) {
      hours = 0;
    }
    finalDate.setHours(hours, selectedMinute, 0, 0);
    onSave(finalDate.toISOString());
  };

  const formatCurrentDeadline = () => {
    const finalDate = new Date(selectedDate);
    let hours = selectedHour;
    if (selectedPeriod === 'PM' && hours !== 12) {
      hours += 12;
    } else if (selectedPeriod === 'AM' && hours === 12) {
      hours = 0;
    }
    finalDate.setHours(hours, selectedMinute, 0, 0);

    return finalDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Time picker scroll helpers
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: COLORS.white,
          paddingTop: 20,
          paddingBottom: 15,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <TouchableOpacity
            onPress={onCancel}
            style={{ marginRight: 15 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              fontSize: 20,
              fontWeight: 'bold',
              color: COLORS.text,
            }}
          >
            Set Deadline
          </Text>
        </View>

        {/* Current Deadline Display */}
        <View
          style={{
            backgroundColor: COLORS.background,
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: COLORS.text,
              textAlign: 'center',
            }}
          >
            {formatCurrentDeadline()}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* SET DATE SECTION */}
        <View style={{ marginBottom: 30 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: COLORS.text,
              marginBottom: 15,
            }}
          >
            Set Date
          </Text>

          {/* Calendar */}
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              padding: 15,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            {/* Month/Year Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                onPress={handlePreviousMonth}
                disabled={!canGoPrevious()}
                style={{ padding: 5 }}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={canGoPrevious() ? COLORS.text : COLORS.border}
                />
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: COLORS.text,
                }}
              >
                {months[currentMonth]} {currentYear}
              </Text>

              <TouchableOpacity onPress={handleNextMonth} style={{ padding: 5 }}>
                <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Days of Week */}
            <View
              style={{
                flexDirection: 'row',
                marginBottom: 10,
              }}
            >
              {daysOfWeek.map((day) => (
                <View
                  key={day}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: COLORS.textLight,
                      fontWeight: '600',
                    }}
                  >
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View>
              {Array.from({ length: 6 }).map((_, weekIndex) => (
                <View
                  key={weekIndex}
                  style={{
                    flexDirection: 'row',
                    marginBottom: 8,
                  }}
                >
                  {calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map((dateObj, index) => {
                    const isSelected = isDateSelected(dateObj);
                    const isTodayDate = isToday(dateObj);
                    const isPast = isPastDate(dateObj);

                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleDateSelect(dateObj)}
                        disabled={isPast}
                        style={{
                          flex: 1,
                          aspectRatio: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 8,
                          backgroundColor: isSelected
                            ? COLORS.primary
                            : 'transparent',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: isTodayDate ? 'bold' : isSelected ? '700' : '400',
                            color: isSelected
                              ? COLORS.white
                              : isPast
                              ? COLORS.border
                              : !dateObj.isCurrentMonth
                              ? COLORS.textLight
                              : COLORS.text,
                          }}
                        >
                          {dateObj.day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* SET TIME SECTION */}
        <View style={{ marginBottom: 30 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: COLORS.text,
              marginBottom: 15,
            }}
          >
            Set Time
          </Text>

          {/* Time Picker */}
          <View
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Hour Picker */}
              <View style={{ alignItems: 'center', marginRight: 10 }}>
                <TouchableOpacity
                  onPress={() => setSelectedHour(selectedHour === 12 ? 1 : selectedHour + 1)}
                  style={{ padding: 10 }}
                >
                  <Ionicons name="chevron-up" size={24} color={COLORS.textLight} />
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 48,
                    fontWeight: 'bold',
                    color: COLORS.primary,
                    width: 80,
                    textAlign: 'center',
                  }}
                >
                  {selectedHour}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedHour(selectedHour === 1 ? 12 : selectedHour - 1)}
                  style={{ padding: 10 }}
                >
                  <Ionicons name="chevron-down" size={24} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>

              {/* Colon */}
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: COLORS.primary,
                  marginHorizontal: 5,
                }}
              >
                :
              </Text>

              {/* Minute Picker */}
              <View style={{ alignItems: 'center', marginLeft: 10 }}>
                <TouchableOpacity
                  onPress={() => setSelectedMinute((selectedMinute + 1) % 60)}
                  style={{ padding: 10 }}
                >
                  <Ionicons name="chevron-up" size={24} color={COLORS.textLight} />
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 48,
                    fontWeight: 'bold',
                    color: COLORS.primary,
                    width: 80,
                    textAlign: 'center',
                  }}
                >
                  {selectedMinute.toString().padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedMinute(selectedMinute === 0 ? 59 : selectedMinute - 1)}
                  style={{ padding: 10 }}
                >
                  <Ionicons name="chevron-down" size={24} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>

              {/* AM/PM Picker */}
              <View style={{ alignItems: 'center', marginLeft: 20 }}>
                <TouchableOpacity
                  onPress={() => setSelectedPeriod(selectedPeriod === 'AM' ? 'PM' : 'AM')}
                  style={{ padding: 10 }}
                >
                  <Ionicons name="chevron-up" size={24} color={COLORS.textLight} />
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: COLORS.primary,
                    width: 60,
                    textAlign: 'center',
                  }}
                >
                  {selectedPeriod}
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedPeriod(selectedPeriod === 'AM' ? 'PM' : 'AM')}
                  style={{ padding: 10 }}
                >
                  <Ionicons name="chevron-down" size={24} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flex: 1,
              backgroundColor: COLORS.background,
              paddingVertical: 15,
              borderRadius: 8,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text
              style={{
                color: COLORS.text,
                fontWeight: '600',
                fontSize: 16,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            style={{
              flex: 1,
              backgroundColor: COLORS.primary,
              paddingVertical: 15,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: COLORS.white,
                fontWeight: '600',
                fontSize: 16,
              }}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default DeadlinePicker;