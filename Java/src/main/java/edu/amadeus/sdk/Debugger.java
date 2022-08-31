package edu.amadeus.sdk;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Function;

public class Debugger {
  private static final String ANSI_CYAN = "\u001B[36m";
  private static final String ANSI_RED = "\u001B[31m";
  private static final String ANSI_RESET = "\u001B[0m";
  private static final SimpleDateFormat DATE_FORMATTER = 
    new SimpleDateFormat ("dd/MM/yyy hh:mm:ss:SSS");
  private AtomicInteger nb = new AtomicInteger(0);

  protected <P, R> Function<P, R> wrapDebugger(Function<P, R> fn) {
    return new Function<P,R>() {
      public R apply(P params) {
        R res = null;
        long sent = System.currentTimeMillis();
        Date sentDate = new Date();
        int count = nb.incrementAndGet();
        try {
          res = fn.apply(params);
          long diff = System.currentTimeMillis() - sent;
          printSuccess(sentDate, diff, count);
        } catch (RuntimeException e) {
          printFail(sentDate, count, e);
        }
        return res;
      }
    };
  }

  private static void printSuccess(Date sent, long diff, int reqNb) {
    System.out.println(ANSI_CYAN + "Request " + reqNb + ANSI_RESET + " sent " + DATE_FORMATTER.format(sent) + "." +
        " Response received after " + diff + "ms from sending");
  }

  private static void printFail(Date sent, int reqNb, Exception e) {
    System.out.println(ANSI_RED + "Request " + reqNb + ANSI_RESET + " sent " + DATE_FORMATTER.format(sent) + " failed." +
        " Exception: " + e.getMessage().replaceAll("\n", " "));
  }
}
