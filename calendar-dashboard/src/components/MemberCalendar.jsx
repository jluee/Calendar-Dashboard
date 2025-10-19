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
      member.meetings.forEach(meetingText => {
        // Extract date and time from meeting text
        const dateMatch = meetingText.match(/(\w+ \d{1,2}, \d{4})/);
        const timeMatch = meetingText.match(/(\d{1,2}:\d{2} [AP]M)/);
        
        if (dateMatch) {
          const meetingDate = new Date(dateMatch[1]);
          memberData[memberName].meetings.push({
            text: meetingText,
            date: meetingDate,
            time: timeMatch ? timeMatch[1] : 'Unknown Time',
            fullText: meetingText
          });
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

  // Get meetings for a specific member on a specific day
  const getMeetingsForDay = (member, day) => {
    const dayString = formatDateForComparison(day);
    return member.meetings.filter(meeting => 
      formatDateForComparison(meeting.date) === dayString
    );
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
      maxWidth: 1200, 
      mx: 'auto', 
      px: { xs: 2, md: 0 },
      backgroundColor: '#fafbfc',
      minHeight: '100vh',
      py: 3
    }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: 4,
        px: 0
      }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 1, 
              fontWeight: 600, 
              color: '#1a202c',
              fontSize: { xs: '1.75rem', md: '2rem' },
              letterSpacing: '-0.02em',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            }}
          >
            Team Calendar
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#4a5568',
              fontWeight: 400,
              fontSize: '0.95rem',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              letterSpacing: '0.01em'
            }}
          >
            Weekly team schedule overview
          </Typography>
        </Box>
        
        {/* View Toggle */}
        <Box sx={{ 
          display: 'flex',
          background: '#ffffff',
          borderRadius: 1,
          border: '1px solid #d1d5db',
          overflow: 'hidden',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <Button
            variant={viewMode === 'calendar' ? 'contained' : 'text'}
            onClick={() => setViewMode('calendar')}
            startIcon={<CalendarViewIcon />}
            sx={{
              minWidth: 120,
              py: 1,
              px: 2,
              fontSize: '0.875rem',
              fontWeight: 500,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              backgroundColor: viewMode === 'calendar' ? '#374151' : 'transparent',
              color: viewMode === 'calendar' ? '#ffffff' : '#6b7280',
              borderRadius: 0,
              '&:hover': {
                backgroundColor: viewMode === 'calendar' ? '#1f2937' : '#f9fafb',
                color: viewMode === 'calendar' ? '#ffffff' : '#374151'
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
            startIcon={<ListViewIcon />}
            sx={{
              minWidth: 120,
              py: 1,
              px: 2,
              fontSize: '0.875rem',
              fontWeight: 500,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              backgroundColor: viewMode === 'list' ? '#374151' : 'transparent',
              color: viewMode === 'list' ? '#ffffff' : '#6b7280',
              borderRadius: 0,
              '&:hover': {
                backgroundColor: viewMode === 'list' ? '#1f2937' : '#f9fafb',
                color: viewMode === 'list' ? '#ffffff' : '#374151'
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

      {/* Filters Section */}
      <Box sx={{ 
        mb: 3, 
        background: '#ffffff',
        borderRadius: 2,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Filters Content */}
        <Box sx={{ 
          p: 3,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: 3,
          flexWrap: 'wrap'
        }}>
          {/* Left side - Filters */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 3,
            flexWrap: 'wrap',
            flex: 1
          }}>
            {/* Team Filter */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              background: '#ffffff',
              px: 2,
              py: 1.5,
              borderRadius: 1,
              border: '1px solid #d1d5db',
              transition: 'all 0.2s ease',
              minWidth: 180,
              '&:hover': {
                borderColor: '#9ca3af',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 24,
                height: 24,
                background: '#374151',
                borderRadius: '4px',
                color: 'white',
                flexShrink: 0
              }}>
                <GroupIcon sx={{ fontSize: '0.9rem' }} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                <Typography variant="caption" sx={{ 
                  color: '#6b7280',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '0.65rem',
                  display: 'block',
                  mb: 0.5,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                }}>
                  Department
                </Typography>
                <FormControl size="small" sx={{ width: '100%' }}>
                  <Select
                    value={selectedTeam}
                    onChange={(e) => {
                      setSelectedTeam(e.target.value);
                      setSelectedMember('all');
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { border: 'none' },
                        '&:hover fieldset': { border: 'none' },
                        '&.Mui-focused fieldset': { border: 'none' },
                        background: 'transparent',
                        fontWeight: 500,
                        color: '#1f2937',
                        width: '100%',
                        textAlign: 'left',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                      },
                      '& .MuiSelect-select': {
                        py: 0.5,
                        px: 1,
                        width: '100%',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textAlign: 'left',
                        justifyContent: 'flex-start',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                      }
                    }}
                  >
                    <MenuItem value="all" sx={{ 
                      fontWeight: 500, 
                      textAlign: 'left',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                    }}>
                      All Teams ({uniqueTeams.length})
                    </MenuItem>
                    {uniqueTeams.map((team) => (
                      <MenuItem 
                        key={team} 
                        value={team}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          fontWeight: 500,
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 500, 
                            color: '#1f2937',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                          }}>
                            {formatTeamName(team)}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: '#6b7280',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                          }}>
                            {Object.values(memberCalendarData).filter(member => member.team === team).length} members
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Member Filter */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              background: '#ffffff',
              px: 2,
              py: 1.5,
              borderRadius: 1,
              border: '1px solid #d1d5db',
              transition: 'all 0.2s ease',
              minWidth: 200,
              '&:hover': {
                borderColor: '#9ca3af',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 24,
                height: 24,
                background: '#374151',
                borderRadius: '4px',
                color: 'white',
                flexShrink: 0
              }}>
                <FilterListIcon sx={{ fontSize: '0.9rem' }} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                <Typography variant="caption" sx={{ 
                  color: '#6b7280',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: '0.65rem',
                  display: 'block',
                  mb: 0.5,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                }}>
                  Team Member
                </Typography>
                <FormControl size="small" sx={{ width: '100%' }}>
                  <Select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    disabled={selectedTeam !== 'all' && Object.keys(filteredMemberData).length === 0}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { border: 'none' },
                        '&:hover fieldset': { border: 'none' },
                        '&.Mui-focused fieldset': { border: 'none' },
                        background: 'transparent',
                        fontWeight: 500,
                        color: selectedTeam !== 'all' && Object.keys(filteredMemberData).length === 0 ? '#94a3b8' : '#1f2937',
                        width: '100%',
                        textAlign: 'left',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                      },
                      '& .MuiSelect-select': {
                        py: 0.5,
                        px: 1,
                        width: '100%',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textAlign: 'left',
                        justifyContent: 'flex-start',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                      }
                    }}
                  >
                    <MenuItem value="all" sx={{ 
                      fontWeight: 500, 
                      textAlign: 'left',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                    }}>
                      All Members ({data.length})
                    </MenuItem>
                    {Object.values(filteredMemberData).map((member) => (
                      <MenuItem 
                        key={member.name} 
                        value={member.name}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          fontWeight: 500,
                          fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif'
                        }}
                      >
                        <Avatar 
                          sx={{ 
                            bgcolor: getTeamColor(member.team),
                            width: 24, 
                            height: 24,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            flexShrink: 0
                          }}
                        >
                          {member.name.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600, 
                            color: '#1e293b',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif'
                          }}>
                            {member.name}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: '#64748b',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            fontFamily: 'Roboto, -apple-system, BlinkMacSystemFont, sans-serif'
                          }}>
                            {formatTeamName(member.team)} • {member.meetings.length} meetings
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>

          {/* Right side - Results Summary */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            px: 2,
            py: 1.5,
            background: '#f9fafb',
            borderRadius: 1,
            border: '1px solid #d1d5db',
            minWidth: 'fit-content'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 24,
              height: 24,
              background: '#374151',
              borderRadius: '4px',
              color: 'white'
            }}>
              <Typography variant="caption" sx={{ 
                fontWeight: 600, 
                fontSize: '0.65rem',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                {Object.keys(filteredMemberData).length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ 
                color: '#1f2937',
                fontWeight: 500,
                fontSize: '0.85rem',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                {Object.keys(filteredMemberData).length === 1 ? 'Member' : 'Members'} Displayed
              </Typography>
              <Typography variant="caption" sx={{ 
                color: '#6b7280',
                fontWeight: 400,
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
              }}>
                {selectedTeam !== 'all' && `from ${formatTeamName(selectedTeam)}`}
                {selectedMember !== 'all' && `: ${selectedMember}`}
                {selectedTeam === 'all' && selectedMember === 'all' && 'across all teams'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Week Navigation */}
      <Box sx={{ 
        mb: 3, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: '#ffffff',
        p: 2,
        borderRadius: 1,
        border: '1px solid #d1d5db',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={goToPreviousWeek}
            size="small"
            sx={{ 
              color: '#6b7280',
              '&:hover': { 
                background: '#f3f4f6',
                color: '#374151'
              }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ 
            fontWeight: 500, 
            color: '#1f2937',
            minWidth: 180,
            textAlign: 'center',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            letterSpacing: '-0.01em'
          }}>
            {weekStart.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </Typography>
          
          <IconButton 
            onClick={goToNextWeek}
            size="small"
            sx={{ 
              color: '#6b7280',
              '&:hover': { 
                background: '#f3f4f6',
                color: '#374151'
              }
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<TodayIcon />}
          onClick={goToCurrentWeek}
          sx={{ 
            borderColor: '#d1d5db',
            color: '#374151',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 500,
            fontSize: '0.875rem',
            '&:hover': {
              borderColor: '#9ca3af',
              background: '#f9fafb'
            }
          }}
        >
          Current Week
        </Button>
      </Box>
      
      {/* Conditional Rendering based on view mode */}
      {viewMode === 'calendar' ? (
        /* Weekly Calendar Table */
      <Card sx={{ 
        borderRadius: 1,
        border: '1px solid #d1d5db',
        background: '#ffffff',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <TableContainer sx={{ maxHeight: { xs: 'auto', md: 600 }, overflowX: { xs: 'auto', md: 'hidden' } }}>
          <Table stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow sx={{ background: '#f9fafb' }}>
                {/* Team Member Column */}
                <TableCell sx={{ 
                  minWidth: { xs: 200, md: 250 }, 
                  width: { xs: 200, md: 250 },
                  background: '#f3f4f6',
                  borderRight: '2px solid #d1d5db',
                  fontWeight: 600,
                  color: '#374151',
                  fontSize: { xs: '0.9rem', md: '0.95rem' },
                  py: { xs: 2, md: 2.5 },
                  position: 'sticky',
                  left: 0,
                  zIndex: 3,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '2px',
                    background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.1))',
                    pointerEvents: 'none'
                  }
                }}>
                  Team Members
                </TableCell>
                
                {/* Day Columns */}
                {weekDays.map((day, index) => (
                  <TableCell 
                    key={index}
                    align="center"
                    sx={{ 
                      minWidth: { xs: 120, md: 140 },
                      width: { xs: 120, md: 140 },
                      background: isToday(day) ? '#f0f9ff' : '#ffffff',
                      borderLeft: index === 0 ? '1px solid #d1d5db' : '1px solid #e5e7eb',
                      borderRight: '1px solid #d1d5db',
                      fontWeight: 600,
                      color: isToday(day) ? '#1e40af' : '#374151',
                      fontSize: { xs: '0.85rem', md: '0.9rem' },
                      py: { xs: 2, md: 2.5 },
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600,
                        color: 'inherit',
                        mb: 0.25,
                        fontSize: '0.8rem',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                      }}>
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: isToday(day) ? '#1e40af' : '#6b7280',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                      }}>
                        {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Typography>
                      {isToday(day) && (
                        <Chip 
                          label="Today" 
                          size="small" 
                          sx={{ 
                            mt: 0.5,
                            bgcolor: '#1e40af',
                            color: 'white',
                            fontWeight: 500,
                            fontSize: '0.6rem',
                            height: 20,
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                          }}
                        />
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
                  {/* Team Member Info */}
                  <TableCell 
                    className="member-info"
                    sx={{ 
                      background: memberIndex % 2 === 0 ? '#fafbfc' : '#f3f4f6',
                      borderRight: '2px solid #d1d5db',
                      py: { xs: 2, md: 2.5 },
                      transition: 'background-color 0.2s ease',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        width: '2px',
                        background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.1))',
                        pointerEvents: 'none'
                      }
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1.5,
                      width: '100%',
                      overflow: 'hidden'
                    }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: getTeamColor(member.team),
                          width: { xs: 36, md: 40 }, 
                          height: { xs: 36, md: 40 },
                          fontSize: { xs: '0.9rem', md: '1rem' },
                          fontWeight: 600,
                          border: '2px solid #ffffff',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          flexShrink: 0
                        }}
                      >
                        {member.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ 
                        minWidth: 0,
                        flex: 1,
                        overflow: 'hidden'
                      }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600,
                          color: '#1f2937',
                          mb: 0.25,
                          fontSize: { xs: '0.95rem', md: '1rem' },
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                        }}>
                          {member.name}
                        </Typography>
                        <Chip 
                          label={formatTeamName(member.team)} 
                          size="small" 
                          sx={{ 
                            bgcolor: getTeamColor(member.team),
                            color: 'white',
                            fontWeight: 500,
                            fontSize: '0.65rem',
                            px: 0.75,
                            py: 0.25,
                            height: 22,
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                          }}
                        />
                        <Typography variant="caption" sx={{ 
                          display: 'block',
                          color: '#6b7280',
                          fontWeight: 400,
                          mt: 0.25,
                          fontSize: '0.7rem',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                        }}>
                          {member.meetings.length} meetings
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  {/* Day Cells */}
                  {weekDays.map((day, dayIndex) => {
                    const dayMeetings = getMeetingsForDay(member, day);
                    
                    return (
                      <TableCell 
                        key={dayIndex}
                        sx={{ 
                          minWidth: { xs: 120, md: 140 },
                          width: { xs: 120, md: 140 },
                          borderLeft: dayIndex === 0 ? '1px solid #d1d5db' : '1px solid #e5e7eb',
                          borderRight: '1px solid #d1d5db',
                          py: { xs: 1.5, md: 2 },
                          verticalAlign: 'top',
                          background: memberIndex % 2 === 0 ? '#ffffff' : '#fafbfc'
                        }}
                      >
                        {dayMeetings.length === 0 ? (
                          <Typography variant="body2" sx={{ 
                            color: '#9ca3af',
                            fontStyle: 'italic',
                            textAlign: 'center',
                            py: { xs: 2, md: 2.5 },
                            fontSize: '0.8rem',
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                          }}>
                            No meetings
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {dayMeetings.map((meeting, meetingIndex) => (
                              <Box 
                                key={meetingIndex}
                                sx={{ 
                                  p: 1.25,
                                  background: `${getTeamColor(member.team)}08`,
                                  border: `1px solid ${getTeamColor(member.team)}20`,
                                  borderRadius: 1,
                                  '&:hover': {
                                    background: `${getTeamColor(member.team)}12`,
                                    borderColor: `${getTeamColor(member.team)}30`,
                                    transform: 'translateY(-1px)',
                                    boxShadow: `0 1px 3px ${getTeamColor(member.team)}15`
                                  },
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Typography variant="caption" sx={{ 
                                  color: getTeamColor(member.team),
                                  fontWeight: 600,
                                  display: 'block',
                                  mb: 0.25,
                                  fontSize: '0.65rem',
                                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
                                  {meeting.time}
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                  color: '#374151',
                                  fontSize: '0.75rem',
                                  lineHeight: 1.3,
                                  fontWeight: 400,
                                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
                                  {meeting.fullText.length > 45 
                                    ? `${meeting.fullText.substring(0, 45)}...` 
                                    : meeting.fullText
                                  }
                                </Typography>
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
        /* List View */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            px: 3,
            py: 2,
            background: '#ffffff',
            borderRadius: 1,
            border: '1px solid #d1d5db',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600,
              color: '#1f2937',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              Team Schedule - {weekStart.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#6b7280',
              fontWeight: 500,
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
            }}>
              {Object.keys(filteredMemberData).length} team members
            </Typography>
          </Box>
          
          {/* Team Members List */}
          {Object.values(filteredMemberData).map((member) => (
            <Card key={member.name} sx={{ 
              borderRadius: 1,
              border: '1px solid #d1d5db',
              background: '#ffffff',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              '&:hover': {
                boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}>
              {/* Member Header */}
              <Box sx={{ 
                p: 3,
                background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: getTeamColor(member.team),
                        width: 48, 
                        height: 48,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        border: '3px solid #ffffff',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                      }}
                    >
                      {member.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600,
                        color: '#1f2937',
                        fontSize: '1.2rem',
                        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                        mb: 0.5
                      }}>
                        {member.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip 
                          label={formatTeamName(member.team)} 
                          size="small" 
                          sx={{ 
                            bgcolor: getTeamColor(member.team),
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 26,
                            px: 1.5,
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                          }}
                        />
                        <Typography variant="body2" sx={{ 
                          color: '#6b7280',
                          fontWeight: 500,
                          fontSize: '0.85rem',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                        }}>
                          {member.meetings.length} meetings scheduled
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Meeting Count Badge */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    background: getTeamColor(member.team),
                    borderRadius: '50%',
                    color: 'white'
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700,
                      fontSize: '1rem',
                      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                    }}>
                      {member.meetings.length}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              {/* Meetings Timeline */}
              <Box sx={{ p: 3 }}>
                {weekDays.map((day, dayIndex) => {
                  const dayMeetings = getMeetingsForDay(member, day);
                  
                  return (
                    <Box key={dayIndex} sx={{ mb: 3 }}>
                      {/* Day Header */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        mb: 2,
                        pb: 1.5,
                        borderBottom: '1px solid #f3f4f6'
                      }}>
                        <Typography variant="subtitle1" sx={{ 
                          fontWeight: 600,
                          color: isToday(day) ? '#1e40af' : '#374151',
                          fontSize: '0.95rem',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                          minWidth: '140px'
                        }}>
                          {day.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Typography>
                        {isToday(day) && (
                          <Chip 
                            label="Today" 
                            size="small" 
                            sx={{ 
                              bgcolor: '#1e40af',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.65rem',
                              height: 20,
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                            }}
                          />
                        )}
                        <Box sx={{ 
                          flex: 1,
                          height: '1px',
                          background: 'linear-gradient(90deg, #e5e7eb 0%, transparent 100%)'
                        }} />
                        <Typography variant="caption" sx={{ 
                          color: '#9ca3af',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                        }}>
                          {dayMeetings.length} meeting{dayMeetings.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      
                      {/* Meetings */}
                      {dayMeetings.length === 0 ? (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2,
                          py: 2,
                          px: 3,
                          background: '#f9fafb',
                          borderRadius: 1,
                          border: '1px solid #f3f4f6'
                        }}>
                          <Box sx={{ 
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#d1d5db'
                          }} />
                          <Typography variant="body2" sx={{ 
                            color: '#9ca3af',
                            fontStyle: 'italic',
                            fontSize: '0.9rem',
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                          }}>
                            No meetings scheduled
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {dayMeetings.map((meeting, meetingIndex) => (
                            <Box 
                              key={meetingIndex}
                              sx={{ 
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 3,
                                p: 3,
                                background: `${getTeamColor(member.team)}08`,
                                border: `1px solid ${getTeamColor(member.team)}25`,
                                borderRadius: 1,
                                '&:hover': {
                                  background: `${getTeamColor(member.team)}12`,
                                  borderColor: `${getTeamColor(member.team)}35`,
                                  transform: 'translateX(4px)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {/* Time Badge */}
                              <Box sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 80,
                                height: 32,
                                background: getTeamColor(member.team),
                                borderRadius: 1,
                                color: 'white'
                              }}>
                                <Typography variant="caption" sx={{ 
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
                                  {meeting.time}
                                </Typography>
                              </Box>
                              
                              {/* Meeting Content */}
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body1" sx={{ 
                                  color: '#1f2937',
                                  fontSize: '0.95rem',
                                  lineHeight: 1.5,
                                  fontWeight: 400,
                                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
                                }}>
                                  {meeting.fullText}
                                </Typography>
                              </Box>
                              
                              {/* Team Color Indicator */}
                              <Box sx={{ 
                                width: 4,
                                height: '100%',
                                background: getTeamColor(member.team),
                                borderRadius: '2px',
                                opacity: 0.6
                              }} />
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
              borderRadius: 1,
              border: '1px solid #d1d5db',
              background: '#ffffff',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                py: 8,
                px: 4
              }}>
                <Box sx={{ 
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3
                }}>
                  <GroupIcon sx={{ fontSize: 32, color: '#9ca3af' }} />
                </Box>
                <Typography variant="h6" sx={{ 
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                  fontWeight: 600,
                  color: '#374151',
                  mb: 1
                }}>
                  No team members found
                </Typography>
                <Typography variant="body2" sx={{ 
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                  color: '#6b7280',
                  textAlign: 'center',
                  maxWidth: 300
                }}>
                  Try adjusting your filters to see more results or select a different team
                </Typography>
              </Box>
            </Card>
          )}
        </Box>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Fab
          color="primary"
          aria-label="scroll to top"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: '#374151',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              background: '#1f2937',
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <ArrowUpIcon />
        </Fab>
      )}
    </Box>
  );
};

MemberCalendar.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    owner: PropTypes.string.isRequired,
    team: PropTypes.string.isRequired,
    meetings: PropTypes.arrayOf(PropTypes.string).isRequired
  })).isRequired
};

export default MemberCalendar;


