import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  MenuItem,
  Fab
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  FilterList as FilterListIcon,
  Group as GroupIcon,
  KeyboardArrowUp as ArrowUpIcon,
  ViewModule as CalendarViewIcon,
  ViewList as ListViewIcon
} from '@mui/icons-material';

const MemberCalendar = ({ data }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedMember, setSelectedMember] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  // Get the start of the current week (Monday)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Get the 5 weekdays (Monday-Friday)
  const getWeekDays = (weekStart) => {
    const days = [];
    for (let i = 0; i < 5; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Go to current week (today)
  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
    // Smooth scroll to top of the calendar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newWeek);
    // Smooth scroll to top of the calendar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newWeek);
    // Smooth scroll to top of the calendar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check if we should show scroll to top button
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Add scroll listener
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Process meetings data by member and date
  const memberCalendarData = useMemo(() => {
    const memberData = {};
    
    data.forEach(member => {
      const memberName = member.owner;
      const team = member.team;
      
      if (!memberData[memberName]) {
        memberData[memberName] = {
          name: memberName,
          team: team,
          meetings: []
        };
      }
      
      // Process each meeting
      member.meetings.forEach(meeting => {
        let meetingData = {};
        
        // Check if meeting is new object structure or old string structure
        if (typeof meeting === 'object' && meeting !== null) {
          // New structure: object with label, start, end, opportunities
          const startDate = new Date(meeting.start);
          
          // Format time from start date
          const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
          const timeStr = startDate.toLocaleTimeString('en-US', timeOptions).replace(/\u202F/g, ' ');
          
          // Extract opportunity data (use first opportunity if multiple exist)
          const opportunity = meeting.opportunities && meeting.opportunities.length > 0 
            ? meeting.opportunities[0] 
            : null;
          
          meetingData = {
            text: meeting.label || '',
            date: startDate,
            time: timeStr,
            fullText: meeting.label || '',
            opportunityName: opportunity?.Name ?? null,
            amount: opportunity?.Amount ?? null,
            stageName: opportunity?.StageName ?? null,
            probability: opportunity?.Probability ?? null
          };
        } else {
          // Old structure: string format
          const meetingText = meeting;
          // Extract date and time from meeting text
          const dateMatch = meetingText.match(/(\w+ \d{1,2}, \d{4})/);
          const timeMatch = meetingText.match(/(\d{1,2}:\d{2} [AP]M)/);
          
          if (dateMatch) {
            const meetingDate = new Date(dateMatch[1]);
            meetingData = {
              text: meetingText,
              date: meetingDate,
              time: timeMatch ? timeMatch[1] : 'Unknown Time',
              fullText: meetingText,
              opportunityName: null,
              amount: null,
              stageName: null,
              probability: null
            };
          }
        }
        
        if (meetingData.date) {
          memberData[memberName].meetings.push(meetingData);
        }
      });
    });

    return memberData;
  }, [data]);

  // Get unique teams from data
  const uniqueTeams = useMemo(() => {
    const teams = [...new Set(Object.values(memberCalendarData).map(member => member.team))];
    return teams.sort();
  }, [memberCalendarData]);

  // Filter data based on selected member and team
  const filteredMemberData = useMemo(() => {
    let filtered = memberCalendarData;

    // First filter by team
    if (selectedTeam !== 'all') {
      filtered = Object.fromEntries(
        Object.entries(memberCalendarData).filter(([, member]) => member.team === selectedTeam)
      );
    }

    // Then filter by member
    if (selectedMember !== 'all') {
      if (filtered[selectedMember]) {
        filtered = { [selectedMember]: filtered[selectedMember] };
      } else {
        filtered = {}; // Member not in selected team
      }
    }

    return filtered;
  }, [memberCalendarData, selectedMember, selectedTeam]);

  // Get current week data
  const weekStart = getWeekStart(currentWeek);
  const weekDays = getWeekDays(weekStart);
  
  // Format date for comparison
  const formatDateForComparison = (date) => {
    return date.toDateString();
  };

  // Get meetings for a specific member on a specific day, sorted by time
  const getMeetingsForDay = (member, day) => {
    const dayString = formatDateForComparison(day);
    const dayMeetings = member.meetings.filter(meeting => 
      formatDateForComparison(meeting.date) === dayString
    );
    
    // Sort meetings by time (ascending order)
    return dayMeetings.sort((a, b) => {
      // Parse time from meeting string (format: "9:30 AM" or "1:30 PM")
      const parseTime = (timeStr) => {
        if (!timeStr || timeStr === 'Unknown Time') return Infinity;
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return Infinity;
        
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const ampm = match[3].toUpperCase();
        
        // Convert to 24-hour format for comparison
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes; // Convert to minutes for easy comparison
      };
      
      const timeA = parseTime(a.time);
      const timeB = parseTime(b.time);
      return timeA - timeB;
    });
  };

  const getTeamColor = (teamName) => {
    const colors = {
      partner: '#3b82f6',
      customerSuccess: '#10b981',
      sales: '#f59e0b',
      marketing: '#8b5cf6',
      engineering: '#ef4444'
    };
    return colors[teamName] || '#6b7280';
  };

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return formatDateForComparison(date) === formatDateForComparison(today);
  };

  // Format team name for display
  const formatTeamName = (teamName) => {
    return teamName.replace(/([A-Z])/g, ' $1').trim();
  };


  return (
    <Box sx={{ 
      maxWidth: 1400, 
      mx: 'auto', 
      px: { xs: 1.5, md: 2 },
      backgroundColor: '#ffffff',
      minHeight: '100vh',
      py: 2
    }}>
      {/* Mobile-Optimized Header Section */}
      <Box sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: { xs: 1.5, sm: 0 },
        mb: 2,
        pb: 2,
        borderBottom: '1px solid #e5e7eb'
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 0.25, 
              fontWeight: 700, 
              color: '#111827',
              fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
              letterSpacing: '-0.02em',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            }}
          >
            Team Calendar
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#6b7280',
              fontWeight: 400,
              fontSize: { xs: '0.6875rem', sm: '0.75rem' },
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            }}
          >
            Weekly schedule overview
          </Typography>
        </Box>
        
        {/* Mobile-Optimized View Toggle */}
        <Box sx={{ 
          display: 'flex',
          background: '#f3f4f6',
          borderRadius: 1.5,
          overflow: 'hidden',
          border: 'none',
          width: { xs: '100%', sm: 'auto' }
        }}>
          <Button
            variant={viewMode === 'calendar' ? 'contained' : 'text'}
            onClick={() => setViewMode('calendar')}
            startIcon={<CalendarViewIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
            sx={{
              flex: { xs: 1, sm: 'none' },
              minWidth: { xs: 0, sm: 100 },
              py: { xs: 1, sm: 0.75 },
              px: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              fontWeight: 600,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              backgroundColor: viewMode === 'calendar' ? '#111827' : 'transparent',
              color: viewMode === 'calendar' ? '#ffffff' : '#6b7280',
              borderRadius: 1.5,
              '&:hover': {
                backgroundColor: viewMode === 'calendar' ? '#1f2937' : 'transparent',
                color: viewMode === 'calendar' ? '#ffffff' : '#111827'
              },
              '&.MuiButton-contained': {
                boxShadow: 'none'
              }
            }}
          >
            Calendar
          </Button>
          <Button
            variant={viewMode === 'list' ? 'contained' : 'text'}
            onClick={() => setViewMode('list')}
            startIcon={<ListViewIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
            sx={{
              flex: { xs: 1, sm: 'none' },
              minWidth: { xs: 0, sm: 100 },
              py: { xs: 1, sm: 0.75 },
              px: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              fontWeight: 600,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              backgroundColor: viewMode === 'list' ? '#111827' : 'transparent',
              color: viewMode === 'list' ? '#ffffff' : '#6b7280',
              borderRadius: 1.5,
              '&:hover': {
                backgroundColor: viewMode === 'list' ? '#1f2937' : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : '#111827'
              },
              '&.MuiButton-contained': {
                boxShadow: 'none'
              }
            }}
          >
            List
          </Button>
        </Box>
      </Box>

      {/* Mobile-Optimized Filters Section */}
      <Box sx={{ 
        mb: 2, 
        background: '#f9fafb',
        borderRadius: 2,
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {/* Filters Content */}
        <Box sx={{ 
          p: { xs: 1, sm: 1.5 },
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1, sm: 2 }
        }}>
          {/* Mobile-Optimized Filters */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.75, 
            background: '#ffffff', 
            borderRadius: 1.5, 
            border: '1px solid #e5e7eb', 
            px: 1, 
            width: { xs: '100%', sm: 'auto' },
            minWidth: { xs: 0, sm: 160 }
          }}>
            <GroupIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: '#6b7280', flexShrink: 0 }} />
            <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
              <Select
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value);
                  setSelectedMember('all');
                }}
                sx={{
                  border: 'none',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  fontWeight: 500,
                  height: { xs: 40, sm: 36 }
                }}
              >
                <MenuItem value="all">All Teams ({uniqueTeams.length})</MenuItem>
                {uniqueTeams.map((team) => (
                  <MenuItem key={team} value={team}>
                    {formatTeamName(team)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.75, 
            background: '#ffffff', 
            borderRadius: 1.5, 
            border: '1px solid #e5e7eb', 
            px: 1, 
            width: { xs: '100%', sm: 'auto' },
            minWidth: { xs: 0, sm: 180 }
          }}>
            <FilterListIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: '#6b7280', flexShrink: 0 }} />
            <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
              <Select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                disabled={selectedTeam !== 'all' && Object.keys(filteredMemberData).length === 0}
                sx={{
                  border: 'none',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    border: 'none'
                  },
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  fontWeight: 500,
                  height: { xs: 40, sm: 36 }
                }}
              >
                <MenuItem value="all">All Members ({data.length})</MenuItem>
                {Object.values(filteredMemberData).map((member) => (
                  <MenuItem key={member.name} value={member.name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: getTeamColor(member.team),
                          width: 20, 
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}
                      >
                        {member.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' }, fontWeight: 500 }}>
                        {member.name}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Mobile-Optimized Summary */}
          <Chip
            label={`${Object.keys(filteredMemberData).length} ${Object.keys(filteredMemberData).length === 1 ? 'member' : 'members'}`}
            size="small"
            sx={{
              height: { xs: 40, sm: 36 },
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              color: '#374151',
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'center', sm: 'flex-start' }
            }}
          />
        </Box>
      </Box>

      {/* Mobile-Optimized Week Navigation */}
      <Box sx={{ 
        mb: 2, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: { xs: 1, sm: 0 },
        background: '#f9fafb',
        p: { xs: 1.25, sm: 1 },
        borderRadius: 1.5,
        border: '1px solid #e5e7eb'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 0.5,
          width: { xs: '100%', sm: 'auto' }
        }}>
          <IconButton 
            onClick={goToPreviousWeek}
            size="small"
            sx={{ 
              color: '#6b7280',
              p: { xs: 1, sm: 0.75 },
              minWidth: { xs: 44, sm: 'auto' },
              minHeight: { xs: 44, sm: 'auto' },
              '&:hover': { 
                background: '#ffffff',
                color: '#111827'
              }
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: { xs: 22, sm: 20 } }} />
          </IconButton>
          
          <Typography variant="body1" sx={{ 
            fontWeight: 600, 
            color: '#111827',
            minWidth: { xs: 0, sm: 160 },
            textAlign: 'center',
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            flex: { xs: 1, sm: 'none' }
          }}>
            {weekStart.toLocaleDateString('en-US', { 
              month: 'short', 
              year: 'numeric' 
            })}
          </Typography>
          
          <IconButton 
            onClick={goToNextWeek}
            size="small"
            sx={{ 
              color: '#6b7280',
              p: { xs: 1, sm: 0.75 },
              minWidth: { xs: 44, sm: 'auto' },
              minHeight: { xs: 44, sm: 'auto' },
              '&:hover': { 
                background: '#ffffff',
                color: '#111827'
              }
            }}
          >
            <ChevronRightIcon sx={{ fontSize: { xs: 22, sm: 20 } }} />
          </IconButton>
        </Box>
        
        <Button
          variant="text"
          size="small"
          startIcon={<TodayIcon sx={{ fontSize: { xs: 18, sm: 16 } }} />}
          onClick={goToCurrentWeek}
          sx={{ 
            color: '#6b7280',
            fontSize: { xs: '0.8125rem', sm: '0.75rem' },
            fontWeight: 500,
            px: { xs: 2, sm: 1.5 },
            py: { xs: 1, sm: 0.5 },
            minWidth: { xs: '100%', sm: 'auto' },
            minHeight: { xs: 44, sm: 'auto' },
            '&:hover': {
              background: '#ffffff',
              color: '#111827'
            }
          }}
        >
          Today
        </Button>
      </Box>
      
      {/* Conditional Rendering based on view mode */}
      {viewMode === 'calendar' ? (
        /* Compact Weekly Calendar Table */
      <Card sx={{ 
        borderRadius: 2,
        border: '1px solid #e5e7eb',
        background: '#ffffff',
        overflow: 'hidden'
      }}>
        <TableContainer sx={{ maxHeight: { xs: 'auto', md: 700 }, overflowX: { xs: 'auto', md: 'hidden' } }}>
          <Table stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow sx={{ background: '#f9fafb' }}>
                {/* Mobile-Optimized Team Member Column */}
                <TableCell sx={{ 
                  minWidth: { xs: 140, sm: 180, md: 220 }, 
                  width: { xs: 140, sm: 180, md: 220 },
                  background: '#f9fafb',
                  borderRight: '1px solid #e5e7eb',
                  fontWeight: 600,
                  color: '#111827',
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  py: { xs: 1, sm: 1.25 },
                  px: { xs: 1, sm: 1.5 },
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                }}>
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Team Members</Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>Members</Box>
                </TableCell>
                
                {/* Mobile-Optimized Day Columns */}
                {weekDays.map((day, index) => (
                  <TableCell 
                    key={index}
                    align="center"
                    sx={{ 
                      minWidth: { xs: 100, sm: 110, md: 130 },
                      width: { xs: 100, sm: 110, md: 130 },
                      background: isToday(day) ? '#eff6ff' : '#ffffff',
                      borderLeft: index === 0 ? '1px solid #e5e7eb' : 'none',
                      borderRight: '1px solid #e5e7eb',
                      fontWeight: 600,
                      color: isToday(day) ? '#2563eb' : '#374151',
                      fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                      py: { xs: 0.75, sm: 1 },
                      px: { xs: 0.5, sm: 1 },
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                    }}
                  >
                    <Box>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 700,
                        color: 'inherit',
                        mb: 0.25,
                        fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                      }}>
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: isToday(day) ? '#2563eb' : '#6b7280',
                        fontWeight: 600,
                        fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                      }}>
                        {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Typography>
                      {isToday(day) && (
                        <Box sx={{ 
                          mt: 0.25,
                          display: 'inline-block',
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          bgcolor: '#2563eb'
                        }} />
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            
            <TableBody>
              {Object.values(filteredMemberData).map((member, memberIndex) => (
                <TableRow 
                  key={member.name}
                  sx={{ 
                    background: memberIndex % 2 === 0 ? '#ffffff' : '#fafbfc',
                    '&:hover': { 
                      background: '#f9fafb',
                      '& .member-info': {
                        background: '#f3f4f6'
                      }
                    },
                    borderBottom: '1px solid #e5e7eb'
                  }}
                >
                  {/* Mobile-Optimized Team Member Info */}
                  <TableCell 
                    className="member-info"
                    sx={{ 
                      background: '#f9fafb',
                      borderRight: '1px solid #e5e7eb',
                      py: { xs: 1, sm: 1.25 },
                      px: { xs: 1, sm: 1.5 },
                      transition: 'background-color 0.2s ease',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: { xs: 0.75, sm: 1 },
                      width: '100%',
                      overflow: 'hidden'
                    }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: getTeamColor(member.team),
                          width: { xs: 28, sm: 32 }, 
                          height: { xs: 28, sm: 32 },
                          fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                          fontWeight: 600,
                          flexShrink: 0
                        }}
                      >
                        {member.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ 
                        minWidth: 0,
                        flex: 1,
                        overflow: 'hidden',
                        display: { xs: 'flex', sm: 'block' },
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 0.25, sm: 0 }
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600,
                          color: '#111827',
                          mb: { xs: 0, sm: 0.25 },
                          fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                          lineHeight: 1.2,
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {member.name}
                        </Typography>
                        <Chip 
                          label={formatTeamName(member.team)} 
                          size="small" 
                          sx={{ 
                            bgcolor: getTeamColor(member.team),
                            color: 'white',
                            fontWeight: 600,
                            fontSize: { xs: '0.5625rem', sm: '0.625rem' },
                            px: { xs: 0.375, sm: 0.5 },
                            py: 0,
                            height: { xs: 16, sm: 18 },
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                            display: { xs: 'none', sm: 'inline-flex' }
                          }}
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  
                  {/* Mobile-Optimized Day Cells */}
                  {weekDays.map((day, dayIndex) => {
                    const dayMeetings = getMeetingsForDay(member, day);
                    
                    return (
                      <TableCell 
                        key={dayIndex}
                        sx={{ 
                          minWidth: { xs: 100, sm: 110, md: 130 },
                          width: { xs: 100, sm: 110, md: 130 },
                          borderRight: '1px solid #e5e7eb',
                          py: { xs: 0.75, sm: 1 },
                          px: { xs: 0.5, sm: 0.75 },
                          verticalAlign: 'top',
                          background: '#ffffff'
                        }}
                      >
                        {dayMeetings.length === 0 ? (
                          <Box sx={{ 
                            height: { xs: 16, sm: 20 },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Box sx={{ 
                              width: 3,
                              height: 3,
                              borderRadius: '50%',
                              backgroundColor: '#e5e7eb'
                            }} />
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.5, sm: 0.75 } }}>
                            {dayMeetings.map((meeting, meetingIndex) => (
                              <Box 
                                key={meetingIndex}
                                sx={{ 
                                  p: { xs: 0.75, sm: 1 },
                                  background: `${getTeamColor(member.team)}0d`,
                                  borderLeft: `2px solid ${getTeamColor(member.team)}`,
                                  borderRadius: 0.5,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    background: `${getTeamColor(member.team)}15`,
                                    transform: 'translateX(2px)'
                                  },
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Typography variant="caption" sx={{ 
                                  color: getTeamColor(member.team),
                                  fontWeight: 700,
                                  display: 'block',
                                  mb: 0.5,
                                  fontSize: { xs: '0.5625rem', sm: '0.625rem' },
                                  lineHeight: 1.2,
                                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
                                  {meeting.time}
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                  color: '#374151',
                                  fontSize: { xs: '0.625rem', sm: '0.6875rem' },
                                  lineHeight: 1.3,
                                  fontWeight: 500,
                                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: { xs: 1, sm: 2 },
                                  WebkitBoxOrient: 'vertical',
                                  mb: 0.75
                                }}>
                                  {meeting.fullText.length > 50 
                                    ? `${meeting.fullText.substring(0, 50)}...` 
                                    : meeting.fullText
                                  }
                                </Typography>
                                {/* Opportunity Details */}
                                <Box sx={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  gap: 0.25,
                                  mt: 0.5,
                                  pt: 0.5,
                                  borderTop: '1px solid rgba(0, 0, 0, 0.08)'
                                }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 0.5 }}>
                                    <Typography variant="caption" sx={{ 
                                      color: '#6b7280',
                                      fontSize: { xs: '0.5rem', sm: '0.5625rem' },
                                      fontWeight: 500,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                                      flexShrink: 0
                                    }}>
                                      Opportunity:
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: '#111827',
                                      fontSize: { xs: '0.5rem', sm: '0.5625rem' },
                                      fontWeight: 600,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                                      textAlign: 'right',
                                      wordBreak: 'break-word',
                                      flex: 1,
                                      minWidth: 0
                                    }}>
                                      {meeting.opportunityName || 'n/a'}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ 
                                      color: '#6b7280',
                                      fontSize: { xs: '0.5rem', sm: '0.5625rem' },
                                      fontWeight: 500,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                      Amount:
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: '#111827',
                                      fontSize: { xs: '0.5rem', sm: '0.5625rem' },
                                      fontWeight: 600,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                      {meeting.amount !== null && meeting.amount !== undefined 
                                        ? `$${meeting.amount.toLocaleString()}` 
                                        : 'n/a'}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ 
                                      color: '#6b7280',
                                      fontSize: { xs: '0.5rem', sm: '0.5625rem' },
                                      fontWeight: 500,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                      Stage:
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: '#111827',
                                      fontSize: { xs: '0.5rem', sm: '0.5625rem' },
                                      fontWeight: 600,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                      {meeting.stageName || 'n/a'}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ 
                                      color: '#6b7280',
                                      fontSize: { xs: '0.5rem', sm: '0.5625rem' },
                                      fontWeight: 500,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                      Probability:
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: '#111827',
                                      fontSize: { xs: '0.5rem', sm: '0.5625rem' },
                                      fontWeight: 600,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                      {meeting.probability !== null && meeting.probability !== undefined 
                                        ? `${meeting.probability}%` 
                                        : 'n/a'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      ) : (
        /* Mobile-Optimized List View */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 } }}>
          {/* Mobile-Optimized Header */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 1, sm: 0 },
            px: { xs: 1.5, sm: 2 },
            py: { xs: 1, sm: 1.25 },
            background: '#f9fafb',
            borderRadius: 1.5,
            border: '1px solid #e5e7eb'
          }}>
            <Typography variant="body1" sx={{ 
              fontWeight: 600,
              color: '#111827',
              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              {weekStart.toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              })} Schedule
            </Typography>
            <Chip
              label={`${Object.keys(filteredMemberData).length} ${Object.keys(filteredMemberData).length === 1 ? 'member' : 'members'}`}
              size="small"
              sx={{
                height: { xs: 28, sm: 24 },
                fontWeight: 600,
                fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                color: '#374151'
              }}
            />
          </Box>
          
          {/* Compact Team Members List */}
          {Object.values(filteredMemberData).map((member) => (
            <Card key={member.name} sx={{ 
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              overflow: 'hidden',
              '&:hover': {
                borderColor: '#d1d5db',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
              },
              transition: 'all 0.2s ease'
            }}>
              {/* Mobile-Optimized Member Header */}
              <Box sx={{ 
                p: { xs: 1.25, sm: 1.5 },
                background: '#f9fafb',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: getTeamColor(member.team),
                      width: { xs: 32, sm: 36 }, 
                      height: { xs: 32, sm: 36 },
                      fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                      fontWeight: 600,
                      flexShrink: 0
                    }}
                  >
                    {member.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 600,
                      color: '#111827',
                      fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                      mb: 0.25,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {member.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1 }, flexWrap: 'wrap' }}>
                      <Chip 
                        label={formatTeamName(member.team)} 
                        size="small" 
                        sx={{ 
                          bgcolor: getTeamColor(member.team),
                          color: 'white',
                          fontWeight: 600,
                          fontSize: { xs: '0.5625rem', sm: '0.625rem' },
                          height: { xs: 16, sm: 18 },
                          px: { xs: 0.375, sm: 0.5 },
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                        }}
                      />
                      <Typography variant="caption" sx={{ 
                        color: '#6b7280',
                        fontWeight: 500,
                        fontSize: { xs: '0.625rem', sm: '0.6875rem' },
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                      }}>
                        {member.meetings.length} meetings
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Mobile-Optimized Meeting Count Badge */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    minWidth: { xs: 24, sm: 28 },
                    height: { xs: 24, sm: 28 },
                    background: getTeamColor(member.team),
                    borderRadius: 1,
                    color: 'white',
                    flexShrink: 0
                  }}>
                    <Typography variant="caption" sx={{ 
                      fontWeight: 700,
                      fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                    }}>
                      {member.meetings.length}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Mobile-Optimized Meetings Timeline */}
              <Box sx={{ p: { xs: 1.25, sm: 1.5 } }}>
                {weekDays.map((day, dayIndex) => {
                  const dayMeetings = getMeetingsForDay(member, day);
                  
                  return (
                    <Box key={dayIndex} sx={{ mb: { xs: 1.5, sm: 2 } }}>
                      {/* Mobile-Optimized Day Header */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: { xs: 0.75, sm: 1 },
                        mb: { xs: 1, sm: 1.25 },
                        pb: { xs: 0.75, sm: 1 },
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 700,
                          color: isToday(day) ? '#2563eb' : '#374151',
                          fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                          minWidth: { xs: '80px', sm: '100px' }
                        }}>
                          {day.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Typography>
                        {isToday(day) && (
                          <Box sx={{ 
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: '#2563eb',
                            flexShrink: 0
                          }} />
                        )}
                        <Box sx={{ 
                          flex: 1,
                          height: '1px',
                          background: '#e5e7eb'
                        }} />
                        <Typography variant="caption" sx={{ 
                          color: '#9ca3af',
                          fontWeight: 500,
                          fontSize: { xs: '0.625rem', sm: '0.6875rem' },
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                          flexShrink: 0
                        }}>
                          {dayMeetings.length}
                        </Typography>
                      </Box>
                      
                      {/* Mobile-Optimized Meetings */}
                      {dayMeetings.length === 0 ? (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: { xs: 0.75, sm: 1 },
                          py: { xs: 0.75, sm: 1 },
                          px: { xs: 1, sm: 1.5 }
                        }}>
                          <Box sx={{ 
                            width: 3,
                            height: 3,
                            borderRadius: '50%',
                            backgroundColor: '#e5e7eb'
                          }} />
                          <Typography variant="caption" sx={{ 
                            color: '#9ca3af',
                            fontStyle: 'italic',
                            fontSize: { xs: '0.625rem', sm: '0.6875rem' },
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                          }}>
                            No meetings
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 1 } }}>
                          {dayMeetings.map((meeting, meetingIndex) => (
                            <Box 
                              key={meetingIndex}
                              sx={{ 
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: { xs: 0.75, sm: 1 },
                                p: { xs: 0.875, sm: 1 },
                                pl: { xs: 1, sm: 1.25 },
                                background: `${getTeamColor(member.team)}0d`,
                                borderLeft: `2px solid ${getTeamColor(member.team)}`,
                                borderRadius: 0.5,
                                cursor: 'pointer',
                                '&:hover': {
                                  background: `${getTeamColor(member.team)}15`,
                                  transform: 'translateX(2px)'
                                },
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {/* Mobile-Optimized Time Badge */}
                              <Box sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: { xs: 48, sm: 56 },
                                height: { xs: 22, sm: 24 },
                                background: getTeamColor(member.team),
                                borderRadius: 0.5,
                                color: 'white',
                                flexShrink: 0
                              }}>
                                <Typography variant="caption" sx={{ 
                                  fontWeight: 700,
                                  fontSize: { xs: '0.5625rem', sm: '0.625rem' },
                                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
                                  {meeting.time}
                                </Typography>
                              </Box>
                              
                              {/* Mobile-Optimized Meeting Content */}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ 
                                  color: '#374151',
                                  fontSize: { xs: '0.6875rem', sm: '0.75rem' },
                                  lineHeight: 1.4,
                                  fontWeight: 500,
                                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: { xs: 2, sm: 2 },
                                  WebkitBoxOrient: 'vertical',
                                  mb: 0.75
                                }}>
                                  {meeting.fullText}
                                </Typography>
                                {/* Opportunity Details */}
                                <Box sx={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  gap: 0.25,
                                  mt: 0.5,
                                  pt: 0.5,
                                  borderTop: '1px solid rgba(0, 0, 0, 0.08)'
                                }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ 
                                      color: '#6b7280',
                                      fontSize: { xs: '0.5625rem', sm: '0.625rem' },
                                      fontWeight: 500,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                      Opportunity:
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: '#111827',
                                      fontSize: { xs: '0.5625rem', sm: '0.625rem' },
                                      fontWeight: 600,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                                      textAlign: 'right',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: { xs: '60%', sm: '70%' }
                                    }}>
                                      {meeting.opportunityName || 'n/a'}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ 
                                      color: '#6b7280',
                                      fontSize: { xs: '0.5625rem', sm: '0.625rem' },
                                      fontWeight: 500,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                      Amount:
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: '#111827',
                                      fontSize: { xs: '0.5625rem', sm: '0.625rem' },
                                      fontWeight: 600,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                      {meeting.amount !== null && meeting.amount !== undefined 
                                        ? `$${meeting.amount.toLocaleString()}` 
                                        : 'n/a'}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ 
                                      color: '#6b7280',
                                      fontSize: { xs: '0.5625rem', sm: '0.625rem' },
                                      fontWeight: 500,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                      Stage:
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: '#111827',
                                      fontSize: { xs: '0.5625rem', sm: '0.625rem' },
                                      fontWeight: 600,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                      {meeting.stageName || 'n/a'}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ 
                                      color: '#6b7280',
                                      fontSize: { xs: '0.5625rem', sm: '0.625rem' },
                                      fontWeight: 500,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                      Probability:
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: '#111827',
                                      fontSize: { xs: '0.5625rem', sm: '0.625rem' },
                                      fontWeight: 600,
                                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                    }}>
                                      {meeting.probability !== null && meeting.probability !== undefined 
                                        ? `${meeting.probability}%` 
                                        : 'n/a'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Card>
          ))}
          
          {Object.keys(filteredMemberData).length === 0 && (
            <Card sx={{ 
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              background: '#ffffff'
            }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                py: { xs: 4, sm: 6 },
                px: { xs: 2, sm: 3 }
              }}>
                <Box sx={{ 
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  borderRadius: '50%',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: { xs: 1.5, sm: 2 }
                }}>
                  <GroupIcon sx={{ fontSize: { xs: 20, sm: 24 }, color: '#9ca3af' }} />
                </Box>
                <Typography variant="body1" sx={{ 
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                  fontWeight: 600,
                  color: '#374151',
                  mb: 0.5,
                  fontSize: { xs: '0.8125rem', sm: '0.875rem' }
                }}>
                  No team members found
                </Typography>
                <Typography variant="caption" sx={{ 
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                  color: '#6b7280',
                  textAlign: 'center',
                  maxWidth: { xs: 240, sm: 280 },
                  fontSize: { xs: '0.6875rem', sm: '0.75rem' }
                }}>
                  Try adjusting your filters to see more results
                </Typography>
              </Box>
            </Card>
          )}
        </Box>
      )}

      {/* Mobile-Optimized Scroll to Top Button */}
      {showScrollTop && (
        <Fab
          color="primary"
          aria-label="scroll to top"
          onClick={scrollToTop}
          size="small"
          sx={{
            position: 'fixed',
            bottom: { xs: 16, sm: 20 },
            right: { xs: 16, sm: 20 },
            background: '#111827',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            width: { xs: 44, sm: 40 },
            height: { xs: 44, sm: 40 },
            minWidth: { xs: 44, sm: 40 },
            minHeight: { xs: 44, sm: 40 },
            '&:hover': {
              background: '#1f2937',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
            },
            transition: 'all 0.2s ease',
            zIndex: 1000
          }}
        >
          <ArrowUpIcon sx={{ fontSize: { xs: 22, sm: 20 } }} />
        </Fab>
      )}
    </Box>
  );
};

MemberCalendar.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    owner: PropTypes.string.isRequired,
    team: PropTypes.string.isRequired,
    meetings: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string, // Old format
        PropTypes.shape({ // New format
          label: PropTypes.string,
          start: PropTypes.string,
          end: PropTypes.string,
          opportunities: PropTypes.arrayOf(PropTypes.shape({
            Amount: PropTypes.number,
            StageName: PropTypes.string,
            Probability: PropTypes.number
          }))
        })
      ])
    ).isRequired
  })).isRequired
};

export default MemberCalendar;


